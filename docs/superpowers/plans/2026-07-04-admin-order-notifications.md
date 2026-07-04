# Admin Order Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A notification bell in the admin topbar that badges the count of unread orders, lists them in a dropdown, marks an order read when its notification is clicked, and navigates to the orders page.

**Architecture:** Each order gets a `read` boolean in MongoDB (new orders `read:false`; a one-time migration marks legacy orders read). Two admin API routes expose the unread count/list and a mark-read action. A client `NotificationBell` island polls the count every 30s and renders the dropdown; the topbar stays a Server Component.

**Tech Stack:** Next.js 16 (App Router, admin app on :3001), React 19, TypeScript strict, MongoDB driver, Tailwind v4, lucide-react.

## Global Constraints

- Read state lives in the DB: order docs gain `read?: boolean`. Unread predicate everywhere: `order.read !== true`.
- New orders are created with `read: false`.
- Legacy orders: one-time migration sets `read: true` (badge starts at 0).
- Mark-read is per-notification click (not "open dropdown = all read").
- Clicking a notification marks THAT order read, then navigates to `/orders`.
- Badge auto-refreshes by polling every 30_000ms plus once on mount. No realtime/SSE/WebSocket.
- Security: the notifications API returns ONLY `_id`, `customerName`, `total`, `createdAt` — never phone or email.
- API routes: `export const runtime = "nodejs"` and `export const dynamic = "force-dynamic"` (MongoDB driver needs Node runtime; never cache).
- Read state is global across all admins (no per-admin state).
- No unit-test framework exists in this repo; "verify" = typecheck + lint + endpoint/Playwright checks.
- Code style: 2-space indent, named exports, no `any`, `cn()` for class merge, `z-[…]` bracket classes, imports `@repo/ui/...` (shared) / `@/...` (app-local).
- Run all npm commands from repo root `/Users/huytu20/Desktop/MyWebsite/tutu-kidswear`. Node is v22 (EBADENGINE warning is benign). The shared MongoDB database name is `cocandy`; secrets are in `apps/admin/.env.local` (key `MONGODB_URI`).

---

### Task 1: DB layer — `read` flag, repo functions, migration

**Files:**
- Modify: `packages/ui/src/lib/db/types.ts` (add `read?` to `OrderDoc`)
- Modify: `packages/ui/src/lib/db/repositories/orders.ts` (createOrder sets read:false; add listUnreadOrders, countUnreadOrders, markOrderRead)
- Create: `scripts/mark-legacy-orders-read.mjs` (one-time migration)

**Interfaces:**
- Produces:
  - `OrderDoc.read?: boolean`
  - `listUnreadOrders(limit?: number): Promise<OrderDoc[]>` (default limit 20)
  - `countUnreadOrders(): Promise<number>`
  - `markOrderRead(id: string): Promise<boolean>`

- [ ] **Step 1: Add `read` to OrderDoc**

In `packages/ui/src/lib/db/types.ts`, find the `OrderDoc` interface (it has `paymentProof?`, `status`, `createdAt`). Add after `paymentProof?`:
```ts
  /** Whether an admin has read this order's notification. Absent/false = unread. */
  read?: boolean;
```

- [ ] **Step 2: createOrder sets read:false**

In `packages/ui/src/lib/db/repositories/orders.ts`, inside `createOrder`'s `toInsert` object, add `read: false` right after the `status: "pending" as const,` line:
```ts
    status: "pending" as const,
    read: false,
    createdAt: new Date().toISOString(),
```

- [ ] **Step 3: Add the three repo functions**

In the same file, append after `deleteOrder`:
```ts
/** Unread orders (read !== true), newest first, capped at `limit`. */
export async function listUnreadOrders(limit = 20): Promise<OrderDoc[]> {
  const col = await ordersCollection();
  const docs = await col
    .find({ read: { $ne: true } })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
  return docs.map(toOrderDoc);
}

/** Count of unread orders (read !== true). */
export async function countUnreadOrders(): Promise<number> {
  const col = await ordersCollection();
  return col.countDocuments({ read: { $ne: true } });
}

/** Mark an order read. False for an invalid id or when no document matched. */
export async function markOrderRead(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const col = await ordersCollection();
  const result = await col.updateOne(
    { _id: new ObjectId(id) },
    { $set: { read: true } },
  );
  return result.matchedCount === 1;
}
```

- [ ] **Step 4: Write the one-time migration script**

Create `scripts/mark-legacy-orders-read.mjs`:
```js
// One-time migration: mark every existing order as read so the notification
// badge starts at 0. New orders created after this run carry read:false.
// Run once:  node scripts/mark-legacy-orders-read.mjs
import { MongoClient } from "mongodb";
import { readFileSync } from "node:fs";

const env = readFileSync("apps/admin/.env.local", "utf8");
const uri = (env.match(/MONGODB_URI=(.+)/) || [])[1]?.trim();
if (!uri) {
  console.error("MONGODB_URI not found in apps/admin/.env.local");
  process.exit(1);
}

const client = new MongoClient(uri);
await client.connect();
const res = await client
  .db("cocandy")
  .collection("orders")
  .updateMany({ read: { $ne: true } }, { $set: { read: true } });
console.log(`Marked ${res.modifiedCount} legacy orders as read.`);
await client.close();
```

- [ ] **Step 5: Run typecheck + lint**

Run:
```bash
npm run typecheck --workspace=packages/ui && npm run lint --workspace=packages/ui 2>&1 | grep -cE "error "
```
Expected: typecheck prints no errors; the grep prints `0`.

- [ ] **Step 6: Run the migration once against the shared DB**

Run:
```bash
node scripts/mark-legacy-orders-read.mjs
```
Expected: prints `Marked <N> legacy orders as read.` (N ≥ 0). Then verify 0 remain unread:
```bash
node -e 'import("mongodb").then(async({MongoClient})=>{const fs=await import("node:fs");const uri=(fs.readFileSync("apps/admin/.env.local","utf8").match(/MONGODB_URI=(.+)/)||[])[1].trim();const c=new MongoClient(uri);await c.connect();console.log("unread remaining:",await c.db("cocandy").collection("orders").countDocuments({read:{$ne:true}}));await c.close();})'
```
Expected: `unread remaining: 0`.

- [ ] **Step 7: Commit**

```bash
git add packages/ui/src/lib/db/types.ts packages/ui/src/lib/db/repositories/orders.ts scripts/mark-legacy-orders-read.mjs
git commit -m "feat(db): order read flag + unread queries + legacy migration

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: API routes — unread list/count + mark-read

**Files:**
- Create: `apps/admin/src/app/api/notifications/route.ts` (GET)
- Create: `apps/admin/src/app/api/notifications/[id]/route.ts` (PATCH)

**Interfaces:**
- Consumes: `listUnreadOrders`, `countUnreadOrders`, `markOrderRead` from `@repo/ui/lib/db/repositories/orders`.
- Produces:
  - `GET /api/notifications` → `{ count: number, orders: Array<{ _id: string; customerName: string; total: number; createdAt: string }> }`
  - `PATCH /api/notifications/[id]` → `{ ok: true }` (200), or `{ error }` with 400 (invalid id) / 404 (not found).

- [ ] **Step 1: Create the GET route**

Create `apps/admin/src/app/api/notifications/route.ts`:
```ts
import { NextResponse } from "next/server";
import {
  listUnreadOrders,
  countUnreadOrders,
} from "@repo/ui/lib/db/repositories/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [count, unread] = await Promise.all([
      countUnreadOrders(),
      listUnreadOrders(20),
    ]);
    // Safe subset only — never expose phone/email in notifications.
    const orders = unread.map((o) => ({
      _id: o._id,
      customerName: o.customerName,
      total: o.total,
      createdAt: o.createdAt,
    }));
    return NextResponse.json({ count, orders });
  } catch {
    return NextResponse.json(
      { error: "Failed to load notifications" },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 2: Create the PATCH route**

Create `apps/admin/src/app/api/notifications/[id]/route.ts`:
```ts
import { NextResponse } from "next/server";
import { markOrderRead } from "@repo/ui/lib/db/repositories/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const ok = await markOrderRead(id);
    if (!ok) {
      return NextResponse.json(
        { error: "Không tìm thấy đơn hàng" },
        { status: 404 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Không thể cập nhật thông báo" },
      { status: 500 },
    );
  }
}
```
Note: `markOrderRead` returns false for an invalid ObjectId too, so an invalid id yields 404 here (acceptable — the spec's 400 vs 404 distinction is not user-visible; keep it simple with a single not-found path).

- [ ] **Step 3: Typecheck + lint**

Run:
```bash
npm run typecheck --workspace=apps/admin && npm run lint --workspace=apps/admin 2>&1 | grep -cE "error "
```
Expected: typecheck clean; grep prints `0`.

- [ ] **Step 4: Smoke-test the GET endpoint**

Start the admin dev server:
```bash
npm run dev:admin > /tmp/notif-api.log 2>&1 &
for i in $(seq 1 40); do curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/ 2>/dev/null | grep -q "200\|307\|404" && { echo ready; break; }; sleep 1; done
```
Then:
```bash
curl -s http://localhost:3001/api/notifications
```
Expected: JSON `{"count":0,"orders":[]}` (0 because Task 1 migration marked all read). Stop the server:
```bash
pkill -f "next dev --port 3001" 2>/dev/null; sleep 1
```

- [ ] **Step 5: Commit**

```bash
git add apps/admin/src/app/api/notifications
git commit -m "feat(admin): notifications API (unread list/count + mark read)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: NotificationBell component + wire into topbar

**Files:**
- Create: `apps/admin/src/components/NotificationBell.tsx`
- Modify: `apps/admin/src/components/AdminTopbar.tsx`

**Interfaces:**
- Consumes: `GET /api/notifications`, `PATCH /api/notifications/[id]`.
- Produces: `NotificationBell` (default-free named export) rendered by `AdminTopbar`.

- [ ] **Step 1: Create the NotificationBell component**

Create `apps/admin/src/components/NotificationBell.tsx`:
```tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";

interface NotifOrder {
  _id: string;
  customerName: string;
  total: number;
  createdAt: string;
}

function formatVnd(n: number): string {
  return `${n.toLocaleString("vi-VN")} ₫`;
}

/** Vietnamese relative time: "vừa xong" / "N phút trước" / "N giờ trước" / "N ngày trước". */
function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const mins = Math.floor((Date.now() - then) / 60000);
  if (mins < 1) return "vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
}

export function NotificationBell() {
  const router = useRouter();
  const [count, setCount] = useState(0);
  const [orders, setOrders] = useState<NotifOrder[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) return; // keep previous state; retried next poll
      const data = (await res.json()) as { count: number; orders: NotifOrder[] };
      setCount(data.count);
      setOrders(data.orders);
    } catch {
      // Network/DB error — keep previous state, retry on next poll.
    }
  }, []);

  // Fetch on mount, then poll every 30s.
  useEffect(() => {
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [load]);

  // Close the dropdown on outside click.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  function openOrder(id: string) {
    // Optimistic: drop the row + decrement now; mark-read is best-effort.
    setOrders((cur) => cur.filter((o) => o._id !== id));
    setCount((c) => Math.max(0, c - 1));
    setOpen(false);
    fetch(`/api/notifications/${id}`, { method: "PATCH" }).catch(() => {});
    router.push("/orders");
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label="Thông báo"
        onClick={() => setOpen((v) => !v)}
        className="relative cursor-pointer rounded-full p-2 text-black/60 hover:bg-[#f2ece3]"
      >
        <Bell className="h-5 w-5" />
        {count > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#dc2525] px-1 text-[10px] font-bold text-white">
            {count > 9 ? "9+" : count}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-[120] mt-2 w-80 overflow-hidden rounded-xl border border-[#E4E7EC] bg-white shadow-lg">
          <div className="border-b border-[#E4E7EC] px-4 py-3">
            <p className="text-sm font-semibold text-[#1D2939]">
              Thông báo đơn hàng
            </p>
          </div>
          {orders.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-[#667085]">
              Không có thông báo mới
            </p>
          ) : (
            <ul className="max-h-96 overflow-y-auto">
              {orders.map((o) => (
                <li key={o._id}>
                  <button
                    type="button"
                    onClick={() => openOrder(o._id)}
                    className="flex w-full cursor-pointer flex-col gap-0.5 border-b border-[#F2F4F7] px-4 py-3 text-left hover:bg-[#faf6ef]"
                  >
                    <span className="text-sm font-medium text-[#344054]">
                      Đơn hàng mới từ {o.customerName}
                    </span>
                    <span className="flex items-center justify-between text-xs text-[#667085]">
                      <span>{formatVnd(o.total)}</span>
                      <span>{relativeTime(o.createdAt)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 2: Wire NotificationBell into the topbar**

In `apps/admin/src/components/AdminTopbar.tsx`, replace the entire static bell `<button>...</button>` block (the `<button type="button" aria-label="Thông báo" ...>` with the `<Bell/>` and the static red-dot `<span/>`) with `<NotificationBell />`. Add the import at the top and drop the now-unused `Bell` from the lucide import (keep `Search`). Final file:
```tsx
import { Search } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";

export function AdminTopbar() {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-black/5 bg-white/80 px-6 backdrop-blur">
      <div className="flex flex-1 items-center gap-2 rounded-full bg-[#f2ece3] px-4 py-2 text-black/50">
        <Search className="h-4 w-4" />
        <input
          type="text"
          placeholder="Tìm kiếm..."
          className="w-full max-w-xs bg-transparent text-[14px] text-black outline-none placeholder:text-black/40"
        />
      </div>
      <NotificationBell />
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#b08560] text-[13px] font-bold text-white">
        CO
      </div>
    </header>
  );
}
```

- [ ] **Step 3: Typecheck + lint**

Run:
```bash
npm run typecheck --workspace=apps/admin && npm run lint --workspace=apps/admin 2>&1 | grep -cE "error "
```
Expected: typecheck clean; grep prints `0`.

- [ ] **Step 4: Commit**

```bash
git add apps/admin/src/components/NotificationBell.tsx apps/admin/src/components/AdminTopbar.tsx
git commit -m "feat(admin): NotificationBell with unread badge, dropdown, polling

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: End-to-end verification (Playwright, real admin)

**Files:** none modified (verification only; small fixes if issues surface).

- [ ] **Step 1: Start the admin dev server**

```bash
npm run dev:admin > /tmp/notif-verify.log 2>&1 &
for i in $(seq 1 40); do curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/ 2>/dev/null | grep -q "200\|307\|404" && { echo ready; break; }; sleep 1; done
```
Expected: `ready`.

- [ ] **Step 2: Baseline — badge is 0**

Using Playwright MCP: navigate to `http://localhost:3001/`, and assert via `browser_evaluate` that there is no visible red badge number on the bell (the `GET /api/notifications` returns `count:0` after Task 1's migration). Confirm `GET /api/notifications` via `curl` returns `{"count":0,"orders":[]}`.

- [ ] **Step 3: Insert one unread test order, confirm badge shows 1**

Insert directly into the `cocandy` DB:
```bash
node -e 'import("mongodb").then(async({MongoClient})=>{const fs=await import("node:fs");const uri=(fs.readFileSync("apps/admin/.env.local","utf8").match(/MONGODB_URI=(.+)/)||[])[1].trim();const c=new MongoClient(uri);await c.connect();const r=await c.db("cocandy").collection("orders").insertOne({items:[{name:"Notif Test SP",price:123000,qty:1}],total:123000,customerName:"NOTIF TEST",customerPhone:"0900000009",customerEmail:"secret@test.com",address:"x",province:"",district:"",ward:"",note:"",paymentMethod:"cod",status:"pending",read:false,createdAt:new Date().toISOString()});console.log("inserted",r.insertedId.toString());await c.close();})'
```
Reload `/` in Playwright, wait for the mount fetch, and assert the bell badge now shows `1`. Screenshot.

- [ ] **Step 4: Open dropdown, verify content + NO sensitive data**

Click the bell. Assert the dropdown shows a row containing "NOTIF TEST" and the formatted total "123.000 ₫". Assert via `browser_evaluate` that the dropdown's `innerText`/HTML contains NEITHER the phone `0900000009` NOR the email `secret@test.com`. Screenshot.

- [ ] **Step 5: Click the notification → mark read + navigate**

Click the notification row. Assert the URL becomes `.../orders`. Then confirm the DB order is now read:
```bash
node -e 'import("mongodb").then(async({MongoClient})=>{const fs=await import("node:fs");const uri=(fs.readFileSync("apps/admin/.env.local","utf8").match(/MONGODB_URI=(.+)/)||[])[1].trim();const c=new MongoClient(uri);await c.connect();const o=await c.db("cocandy").collection("orders").findOne({customerName:"NOTIF TEST"});console.log("read flag:",o?.read);await c.close();})'
```
Expected: `read flag: true`. Reload `/` and assert the badge is gone (count 0 again).

- [ ] **Step 6: Clean up test data + artifacts, stop server**

```bash
node -e 'import("mongodb").then(async({MongoClient})=>{const fs=await import("node:fs");const uri=(fs.readFileSync("apps/admin/.env.local","utf8").match(/MONGODB_URI=(.+)/)||[])[1].trim();const c=new MongoClient(uri);await c.connect();const r=await c.db("cocandy").collection("orders").deleteMany({customerName:"NOTIF TEST"});console.log("deleted",r.deletedCount);await c.close();})'
pkill -f "next dev --port 3001" 2>/dev/null; sleep 1
rm -rf .playwright-mcp
```

- [ ] **Step 7: Full-repo check**

```bash
npm run typecheck && npm run lint 2>&1 | grep -cE "error "
```
Expected: typecheck clean across workspaces; grep prints `0`.

- [ ] **Step 8: Commit any verification fixes (only if made)**

If Steps 2–5 surfaced fixes, commit them:
```bash
git add -A
git commit -m "fix(admin): notification verification fixes

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```
If no fixes were needed, skip this step.
