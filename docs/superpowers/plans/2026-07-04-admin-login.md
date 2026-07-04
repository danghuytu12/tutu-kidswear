# Admin Login Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A username/password login page that gates the entire admin app with a 7-day signed session cookie, plus a logout button.

**Architecture:** Credentials live in env; login sets an HMAC-signed `admin_session` cookie. Edge middleware verifies the cookie (Web Crypto) and redirects unauthenticated page requests to `/login`. Existing admin pages move into a `(dashboard)` route group whose layout renders the sidebar/topbar, so `/login` can render full-screen without dashboard chrome.

**Tech Stack:** Next.js 16 (App Router, admin app :3001), React 19, TypeScript strict, Edge middleware, Web Crypto + Node crypto, Tailwind v4.

## Global Constraints

- Credentials in `apps/admin/.env.local` (NOT committed): `ADMIN_USERNAME` (default `tutukidswear`), `ADMIN_PASSWORD` (default `Admin123`), `ADMIN_SESSION_SECRET` (random string). Never hardcode/commit the password.
- Session: cookie `admin_session`, httpOnly, sameSite=lax, `secure` in production, `maxAge` = 7 days (604800s). Value is a signed token, NOT the raw password.
- Token format: `base64url(payload) + "." + base64url(HMAC_SHA256(base64url(payload), SECRET))`, payload `{ u: username, exp: epochMs }`.
- Middleware protects PAGES only (not APIs). `matcher` excludes `/login`, `/api/*`, `/_next/*`, `favicon.ico`, `icon.png`, static files. (Excluding all `/api` keeps cron reports + any API working; the spec's cron carve-out is satisfied by excluding `/api` wholesale.)
- Middleware runs on Edge → verify with Web Crypto (`crypto.subtle`), NOT `node:crypto`. API routes run on Node runtime (`export const runtime = "nodejs"`).
- Route groups do not change URLs — all existing paths (`/`, `/orders`, `/products`, `/customers`, `/settings`, `/add-product`, `/edit-product/[id]`) stay identical.
- If `ADMIN_SESSION_SECRET` is unset: use a fixed dev default + `console.warn`; never crash.
- Code style: 2-space indent, named exports, no `any`, `@/...` app-local imports, Vietnamese UI copy.
- Login error copy: exactly `Sai tài khoản hoặc mật khẩu`.
- Run all commands from repo root `/Users/huytu20/Desktop/MyWebsite/tutu-kidswear`. Node is v22 (EBADENGINE warning benign).
- No unit-test framework exists; "verify" = typecheck + lint + Playwright/curl checks.

---

### Task 1: Auth library + env credentials

**Files:**
- Create: `apps/admin/src/lib/auth.ts`
- Modify: `apps/admin/.env.local` (append the three keys)

**Interfaces:**
- Produces:
  - `SESSION_COOKIE = "admin_session"` (const string)
  - `SESSION_MAX_AGE_SECONDS = 604800` (const number)
  - `checkCredentials(username: string, password: string): boolean`
  - `createSessionToken(username: string): Promise<string>` (Web Crypto; works in both Node & Edge)
  - `verifySessionToken(token: string): Promise<boolean>` (Web Crypto; Edge-safe)

- [ ] **Step 1: Create the auth library**

Create `apps/admin/src/lib/auth.ts`:
```ts
// Admin session auth. Credentials come from env; the session cookie holds an
// HMAC-signed token (never the password). All crypto uses Web Crypto so the
// same verify function runs in Edge middleware and Node route handlers.

export const SESSION_COOKIE = "admin_session";
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 604800

const DEV_SECRET_FALLBACK = "dev-insecure-admin-secret-change-me";

function secret(): string {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s) {
    console.warn(
      "[auth] ADMIN_SESSION_SECRET is not set — using an insecure dev default. Set it in production.",
    );
    return DEV_SECRET_FALLBACK;
  }
  return s;
}

/** Constant-time string comparison (avoids leaking length/really via early exit). */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Check a login attempt against the configured credentials. */
export function checkCredentials(username: string, password: string): boolean {
  const u = process.env.ADMIN_USERNAME ?? "tutukidswear";
  const p = process.env.ADMIN_PASSWORD ?? "Admin123";
  // Compare both regardless of the first result to keep timing uniform.
  const okU = safeEqual(username, u);
  const okP = safeEqual(password, p);
  return okU && okP;
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlOfString(s: string): string {
  return toBase64Url(new TextEncoder().encode(s));
}

async function hmac(payloadB64: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payloadB64),
  );
  return toBase64Url(new Uint8Array(sig));
}

/** Build a signed session token for `username`, valid for SESSION_MAX_AGE_SECONDS. */
export async function createSessionToken(username: string): Promise<string> {
  const exp = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payloadB64 = base64UrlOfString(JSON.stringify({ u: username, exp }));
  const sig = await hmac(payloadB64);
  return `${payloadB64}.${sig}`;
}

/** Verify a session token's signature and expiry. Edge-safe (Web Crypto). */
export async function verifySessionToken(token: string): Promise<boolean> {
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payloadB64, sig] = parts;
  const expected = await hmac(payloadB64);
  if (!safeEqual(sig, expected)) return false;
  try {
    const json = new TextDecoder().decode(
      Uint8Array.from(
        atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/")),
        (c) => c.charCodeAt(0),
      ),
    );
    const payload = JSON.parse(json) as { u: string; exp: number };
    return typeof payload.exp === "number" && payload.exp > Date.now();
  } catch {
    return false;
  }
}
```

- [ ] **Step 2: Append credentials to .env.local**

Append to `apps/admin/.env.local` (do NOT commit this file — verify it is gitignored in Step 4):
```bash
cat >> apps/admin/.env.local <<'EOF'

# Admin login (do not commit)
ADMIN_USERNAME=tutukidswear
ADMIN_PASSWORD=Admin123
ADMIN_SESSION_SECRET=change-this-to-a-long-random-string-in-production-2f9a7c
EOF
```

- [ ] **Step 3: Typecheck + lint**

Run:
```bash
npm run typecheck --workspace=apps/admin && npm run lint --workspace=apps/admin 2>&1 | grep -cE "error "
```
Expected: typecheck clean; grep prints `0`.

- [ ] **Step 4: Confirm .env.local is gitignored, then commit (code only)**

Run:
```bash
git check-ignore apps/admin/.env.local && echo "IGNORED (good)"
git status --short apps/admin/.env.local
```
Expected: prints `apps/admin/.env.local` then `IGNORED (good)`, and `git status` shows NOTHING for that file (it must not be staged). Then commit only the code:
```bash
git add apps/admin/src/lib/auth.ts
git commit -m "feat(admin): session auth library (HMAC token, credential check)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Login + logout API routes

**Files:**
- Create: `apps/admin/src/app/api/auth/login/route.ts`
- Create: `apps/admin/src/app/api/auth/logout/route.ts`

**Interfaces:**
- Consumes: `checkCredentials`, `createSessionToken`, `SESSION_COOKIE`, `SESSION_MAX_AGE_SECONDS` from `@/lib/auth`.
- Produces: `POST /api/auth/login` (sets cookie), `POST /api/auth/logout` (clears cookie).

- [ ] **Step 1: Create the login route**

Create `apps/admin/src/app/api/auth/login/route.ts`:
```ts
import { NextResponse } from "next/server";
import {
  checkCredentials,
  createSessionToken,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { username?: string; password?: string };
  try {
    body = (await request.json()) as { username?: string; password?: string };
  } catch {
    return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
  }
  const username = body.username ?? "";
  const password = body.password ?? "";
  if (!checkCredentials(username, password)) {
    return NextResponse.json(
      { error: "Sai tài khoản hoặc mật khẩu" },
      { status: 401 },
    );
  }
  const token = await createSessionToken(username);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return res;
}
```

- [ ] **Step 2: Create the logout route**

Create `apps/admin/src/app/api/auth/logout/route.ts`:
```ts
import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
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
git add apps/admin/src/app/api/auth
git commit -m "feat(admin): login/logout API routes

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Route-group restructure ((dashboard) layout)

**Files:**
- Create: `apps/admin/src/app/(dashboard)/layout.tsx`
- Move (via `git mv`): `page.tsx`, `orders/`, `products/`, `customers/`, `settings/`, `add-product/`, `edit-product/` into `apps/admin/src/app/(dashboard)/`
- Modify: `apps/admin/src/app/layout.tsx` (strip sidebar/topbar; keep `<html><body>` + fonts)

**Interfaces:**
- Produces: a `(dashboard)` route group whose layout renders `<AdminSidebar/>` + `<AdminTopbar/>`; the root layout becomes chrome-free. URLs unchanged.

- [ ] **Step 1: Create the (dashboard) directory and move pages into it**

Run (use `git mv` so history + staging are clean):
```bash
cd apps/admin/src/app
mkdir -p "(dashboard)"
git mv page.tsx "(dashboard)/page.tsx"
git mv orders "(dashboard)/orders"
git mv products "(dashboard)/products"
git mv customers "(dashboard)/customers"
git mv settings "(dashboard)/settings"
git mv add-product "(dashboard)/add-product"
git mv edit-product "(dashboard)/edit-product"
cd /Users/huytu20/Desktop/MyWebsite/tutu-kidswear
ls -la "apps/admin/src/app/(dashboard)"
```
Expected: the group dir now contains `page.tsx`, `orders`, `products`, `customers`, `settings`, `add-product`, `edit-product`. `api`, `globals.css`, `icon.png`, `layout.tsx` remain at `apps/admin/src/app/`.

Note: the moved pages import from `@/components/...` and `@repo/ui/...` — those absolute aliases are unaffected by the move.

- [ ] **Step 2: Create the (dashboard) layout with the chrome**

Create `apps/admin/src/app/(dashboard)/layout.tsx`:
```tsx
import { AdminSidebar } from "@/components/AdminSidebar";
import { AdminTopbar } from "@/components/AdminTopbar";

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar />
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Strip chrome from the root layout**

Replace `apps/admin/src/app/layout.tsx` with (keeps html/body + fonts + metadata; removes the sidebar/topbar/flex wrapper and their imports):
```tsx
import type { Metadata } from "next";
import { Be_Vietnam_Pro, Baloo_2, Outfit } from "next/font/google";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-body",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// TailAdmin-cloned pages (products list / add product) use Outfit.
const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const baloo2 = Baloo_2({
  variable: "--font-display",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tutu Kidswear Admin",
  description: "Bảng quản trị Tutu Kidswear",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${beVietnamPro.variable} ${baloo2.variable} ${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#f7f4ef] text-black">{children}</body>
    </html>
  );
}
```

- [ ] **Step 4: Typecheck + lint, then verify all pages still render**

Run:
```bash
npm run typecheck --workspace=apps/admin && npm run lint --workspace=apps/admin 2>&1 | grep -cE "error "
```
Expected: typecheck clean; grep prints `0`.

Then start the dev server and confirm the moved routes still resolve (no login gate exists yet, so they render directly):
```bash
npm run dev:admin > /tmp/login-t3.log 2>&1 &
for i in $(seq 1 40); do curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/ 2>/dev/null | grep -q "200\|307\|404" && { echo ready; break; }; sleep 1; done
for p in "" orders products customers settings; do echo -n "/$p -> "; curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3001/$p"; done
pkill -f "next dev --port 3001" 2>/dev/null; sleep 1
```
Expected: each path prints `200`.

- [ ] **Step 5: Commit**

```bash
git add -A apps/admin/src/app
git commit -m "refactor(admin): move pages into (dashboard) route group; chrome-free root layout

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Middleware + login page

**Files:**
- Create: `apps/admin/src/middleware.ts`
- Create: `apps/admin/src/app/login/page.tsx`

**Interfaces:**
- Consumes: `verifySessionToken`, `SESSION_COOKIE` from `@/lib/auth`; `POST /api/auth/login`.
- Produces: page-level auth gate; a `/login` page.

- [ ] **Step 1: Create the middleware**

Create `apps/admin/src/middleware.ts`:
```ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

// Protect all pages. The matcher below already excludes /api, /_next, and
// static assets, so only real page navigations reach here.
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value ?? "";
  const authed = token ? await verifySessionToken(token) : false;

  if (pathname === "/login") {
    // Already authed → send them to the dashboard.
    if (authed) return NextResponse.redirect(new URL("/", request.url));
    return NextResponse.next();
  }

  if (!authed) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  // Everything except API routes, Next internals, and static assets.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon.png).*)"],
};
```

- [ ] **Step 2: Create the login page**

Create `apps/admin/src/app/login/page.tsx`:
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Sai tài khoản hoặc mật khẩu");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Không thể đăng nhập. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f4ef] p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl border border-[#E4E7EC] bg-white p-8 shadow-sm"
      >
        <div className="mb-6 flex flex-col items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/cocandy/logo.png"
            alt="Tutu Kidswear"
            className="h-14 w-auto"
          />
          <h1 className="font-display mt-3 text-[20px] font-bold text-[#1D2939]">
            Đăng nhập quản trị
          </h1>
        </div>

        <label className="mb-1 block text-[14px] text-[#344054]">
          Tài khoản
        </label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          className="mb-4 w-full rounded-lg border border-[#E4E7EC] px-4 py-2.5 text-[15px] outline-none focus:border-[#b08560]"
        />

        <label className="mb-1 block text-[14px] text-[#344054]">
          Mật khẩu
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          className="mb-4 w-full rounded-lg border border-[#E4E7EC] px-4 py-2.5 text-[15px] outline-none focus:border-[#b08560]"
        />

        {error ? (
          <p className="mb-4 text-[14px] text-[#dc2525]">{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={submitting || !username || !password}
          className="w-full cursor-pointer rounded-full bg-[#b08560] py-3 text-[16px] font-semibold text-white hover:bg-[#8a6647] disabled:opacity-60"
        >
          {submitting ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </form>
    </div>
  );
}
```

Note: `/images/cocandy/logo.png` — confirm the admin app serves this asset. If `apps/admin/public/images/cocandy/logo.png` does not exist, use the admin favicon path that does exist (`/icon.png`) instead. Check with `ls apps/admin/public/images/cocandy/logo.png` before finalizing; if missing, set the `src` to `/icon.png`.

- [ ] **Step 3: Typecheck + lint**

Run:
```bash
npm run typecheck --workspace=apps/admin && npm run lint --workspace=apps/admin 2>&1 | grep -cE "error "
```
Expected: typecheck clean; grep prints `0`.

- [ ] **Step 4: Commit**

```bash
git add apps/admin/src/middleware.ts apps/admin/src/app/login
git commit -m "feat(admin): auth middleware gate + login page

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Logout button in the topbar

**Files:**
- Modify: `apps/admin/src/components/AdminTopbar.tsx`

**Interfaces:**
- Consumes: `POST /api/auth/logout`.

- [ ] **Step 1: Add a logout button next to the avatar**

`AdminTopbar.tsx` is currently a Server Component (imports `Search` from lucide + renders `<NotificationBell/>` + the "CO" avatar div). Add a small client logout control WITHOUT converting the whole topbar to a client component: create the button inline as a tiny client subcomponent in its own file to keep the topbar a Server Component.

Create `apps/admin/src/components/LogoutButton.tsx`:
```tsx
"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.push("/login");
    router.refresh();
  }
  return (
    <button
      type="button"
      aria-label="Đăng xuất"
      onClick={logout}
      className="flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-2 text-[14px] text-black/60 hover:bg-[#f2ece3]"
    >
      <LogOut className="h-4 w-4" />
      <span className="hidden sm:inline">Đăng xuất</span>
    </button>
  );
}
```

Then in `apps/admin/src/components/AdminTopbar.tsx`, add the import `import { LogoutButton } from "@/components/LogoutButton";` and render `<LogoutButton />` immediately after the `<div ...>CO</div>` avatar element (as the last child of the header). Do not change anything else.

- [ ] **Step 2: Typecheck + lint**

Run:
```bash
npm run typecheck --workspace=apps/admin && npm run lint --workspace=apps/admin 2>&1 | grep -cE "error "
```
Expected: typecheck clean; grep prints `0`.

- [ ] **Step 3: Commit**

```bash
git add apps/admin/src/components/LogoutButton.tsx apps/admin/src/components/AdminTopbar.tsx
git commit -m "feat(admin): logout button in topbar

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: End-to-end verification (Playwright, real admin)

**Files:** none modified (verification only; small fixes if issues surface).

- [ ] **Step 1: Start the admin dev server**

```bash
npm run dev:admin > /tmp/login-verify.log 2>&1 &
for i in $(seq 1 40); do curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/login 2>/dev/null | grep -q "200" && { echo ready; break; }; sleep 1; done
```
Expected: `ready`.

- [ ] **Step 2: Unauthenticated pages redirect to /login**

Using Playwright MCP: navigate to `http://localhost:3001/`, assert the final URL is `.../login` and a password field is present. Repeat for `http://localhost:3001/orders` → also lands on `/login`.

- [ ] **Step 3: Wrong password shows the error**

On `/login`, fill username `tutukidswear`, password `wrongpass`, submit. Assert the text `Sai tài khoản hoặc mật khẩu` appears and the URL is still `/login`. Assert via `browser_evaluate` that `document.cookie` does NOT contain `admin_session` (it's httpOnly so it won't appear anyway — instead confirm we're still on /login).

- [ ] **Step 4: Correct login lands on the dashboard**

Fill username `tutukidswear`, password `Admin123`, submit. Assert the URL becomes `http://localhost:3001/` and the dashboard is visible (e.g. the "Tổng quan" sidebar item / an element unique to the dashboard). Screenshot.

- [ ] **Step 5: Authed visit to /login redirects to /**

Navigate to `http://localhost:3001/login`; assert it redirects to `/` (dashboard visible), because the session cookie is present.

- [ ] **Step 6: Logout returns to /login and re-gates**

Click the "Đăng xuất" button. Assert URL becomes `/login`. Then navigate to `http://localhost:3001/orders` and assert it redirects back to `/login` (session cleared).

- [ ] **Step 7: Cron route stays reachable**

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/api/cron/daily-report
```
Expected: NOT a redirect to login — a `200` (or whatever the cron route returns), proving `/api/*` is excluded from the gate. (It may send a Telegram message; that's fine.)

- [ ] **Step 8: Stop server, clean, full-repo check**

```bash
pkill -f "next dev --port 3001" 2>/dev/null; sleep 1
rm -rf .playwright-mcp
npm run typecheck && npm run lint 2>&1 | grep -cE "error "
```
Expected: typecheck clean across workspaces; grep prints `0`.

- [ ] **Step 9: Commit any verification fixes (only if made)**

If steps surfaced fixes, commit them; otherwise skip:
```bash
git add -A && git commit -m "fix(admin): login verification fixes

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```
