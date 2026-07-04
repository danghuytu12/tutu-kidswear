# Admin Order Notifications — Design

**Date:** 2026-07-04
**Scope:** A notification bell in the admin topbar that shows a badge count of unread orders, lists them in a dropdown, marks an order read when its notification is clicked, and navigates to the orders page.

## Goals

- The bell badge shows the number of unread orders (hidden when 0).
- Clicking the bell opens a dropdown listing unread orders (customer name, total, relative time).
- Clicking one notification marks THAT order read (badge decrements) and navigates to `/orders`.
- Read/unread state is stored in the database (synced across browsers/machines).
- The badge auto-updates by polling every 30 seconds (no realtime/WebSocket).

## Decisions (locked)

- **Read state storage:** DB — each order document gets a `read` boolean.
- **Mark-read trigger:** per-notification click (not "open dropdown = all read").
- **On click:** mark that order read, then navigate to `/orders`.
- **Badge refresh:** poll every 30s (plus immediately on mount).
- **Legacy orders:** a one-time migration marks all existing orders `read: true`, so the badge only counts orders placed from now on.
- **Security:** the notifications API returns only `_id`, `customerName`, `total`, `createdAt` — NOT phone or email (avoid exposing sensitive customer data in the dropdown).

## Data model

`OrderDoc` (and stored order docs) gain:
- `read?: boolean` — whether an admin has read this order's notification. Absent OR `false` → unread. New orders are created with `read: false`.

Unread predicate everywhere: `order.read !== true`.

## Backend

**`packages/ui/src/lib/db/repositories/orders.ts`:**
- `createOrder(...)` — add `read: false` to the inserted document.
- `listUnreadOrders(limit = 20): Promise<OrderDoc[]>` — orders where `read !== true`, newest first, capped at `limit`.
- `countUnreadOrders(): Promise<number>` — count of orders where `read !== true` (uncapped).
- `markOrderRead(id: string): Promise<boolean>` — set `read: true` on the order; returns false for an invalid id or when no document matched.

**API routes (admin app):**
- `GET /api/notifications` → `{ count: number, orders: Array<{ _id: string; customerName: string; total: number; createdAt: string }> }`. `count` = `countUnreadOrders()`; `orders` = `listUnreadOrders(20)` mapped to the safe field subset (no phone/email). `runtime = "nodejs"`, `dynamic = "force-dynamic"`.
- `PATCH /api/notifications/[id]` → marks the order read via `markOrderRead(id)`. Invalid id → 400; not found → 404; success → `{ ok: true }`.

## Frontend

**`apps/admin/src/components/NotificationBell.tsx`** (client component):
- State: `count`, `orders` (safe subset), `open`.
- On mount: fetch `GET /api/notifications`; then `setInterval` every 30_000ms; clear on unmount.
- Badge: shown only when `count > 0`; renders `count` (or `"9+"` when `> 9`) as a red badge on the bell.
- Dropdown: toggled by clicking the bell; closes on outside click (document mousedown listener) and after a notification click. Lists each unread order — customer name, formatted total (VND), and relative time. Empty state: "Không có thông báo mới".
- Relative time (Vietnamese): "vừa xong" (<1 min), "N phút trước", "N giờ trước", "N ngày trước".
- Notification click: optimistically remove the row and decrement `count`, call `PATCH /api/notifications/[id]` (best-effort — navigation proceeds even if it fails; a failed mark simply reappears on the next poll), then `router.push("/orders")`.
- Error handling: a failed `GET` keeps the previous count (no crash); retried on the next poll.

**`apps/admin/src/components/AdminTopbar.tsx`:** replace the static bell button (with its always-on red dot) with `<NotificationBell />`. The topbar stays a Server Component; the bell is the client island.

## Migration (one-time)

A script sets `read: true` on all existing order documents so the badge starts at 0. Run once against the shared DB. New orders created afterward carry `read: false`.

## Testing / verification (Playwright, real admin)

1. After migration, the bell badge is 0 (all legacy orders read).
2. Insert one test order with `read: false` → within a poll cycle the badge shows 1.
3. Click the bell → dropdown shows that order (customer name + total).
4. Click the row → `PATCH` fires, badge returns to 0, navigates to `/orders`; DB confirms that order is now `read: true`.
5. Confirm the dropdown markup contains NO phone/email.
6. Delete test data; `npm run typecheck` + `npm run lint` clean.

## Non-goals

- No realtime push (SSE/WebSocket).
- No per-admin read state (read is global across all admins).
- No notifications for anything other than new orders (no status-change/stock alerts).
- No changes to the storefront or the Telegram notifier.
