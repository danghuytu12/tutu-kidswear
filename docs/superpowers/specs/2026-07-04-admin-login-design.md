# Admin Login Gate — Design

**Date:** 2026-07-04
**Scope:** A username/password login page that gates the entire admin app. Unauthenticated visitors are redirected to `/login`; a signed session cookie keeps them logged in for 7 days; a logout button ends the session.

## Goals

- A `/login` page with username + password fields.
- Correct credentials → a signed session cookie is set; the admin is redirected to `/`.
- Every admin page is protected: unauthenticated access redirects to `/login`.
- The session lasts 7 days.
- A logout button in the topbar ends the session and returns to `/login`.

## Decisions (locked)

- **Credentials in env** (`apps/admin/.env.local`, NOT committed): `ADMIN_USERNAME` (default `tutukidswear`), `ADMIN_PASSWORD` (default `Admin123`), plus `ADMIN_SESSION_SECRET` (random string, used to sign the session cookie). The password is never written into source or committed.
- **Session:** an HMAC-SHA256-signed cookie `admin_session`, httpOnly, sameSite=lax, secure in production, maxAge 7 days. The cookie holds a signed token — NOT the raw password.
- **Protection scope:** all admin PAGES via middleware. Not the APIs (they were not requested and blocking them risks breaking the cron reports and storefront order creation). `/api/cron/*` explicitly stays open (guarded separately by CRON_SECRET).
- **Logout:** button in the topbar.
- **Session duration:** 7 days.

## Architecture

### Session token (HMAC)
`apps/admin/src/lib/auth.ts`:
- Token format: `base64url(payload) + "." + base64url(HMAC_SHA256(base64url(payload), SECRET))`, where `payload = { u: <username>, exp: <epoch-ms 7 days out> }`.
- `checkCredentials(user, pass): boolean` — constant-time compare against `ADMIN_USERNAME`/`ADMIN_PASSWORD` env.
- `createSessionToken(username): string` — builds and signs the token (Node crypto, used in the login API route which runs on the Node runtime).
- `verifySessionTokenEdge(token): Promise<boolean>` — verifies signature (Web Crypto `crypto.subtle`, so it runs in the Edge middleware) and checks `exp` not expired. Uses a constant-time signature comparison.
- `SESSION_COOKIE = "admin_session"`, `SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60`.
- If `ADMIN_SESSION_SECRET` is unset, fall back to a fixed dev default and `console.warn` (never crash); production should set a real secret.

### Middleware
`apps/admin/src/middleware.ts`:
- `matcher` excludes: `/login`, `/api/auth/*`, `/api/cron/*`, `/_next/*`, `favicon.ico`, `icon.png`, and other static files.
- Reads the `admin_session` cookie and `verifySessionTokenEdge`.
- Invalid/absent session AND path ≠ `/login` → redirect to `/login`.
- Valid session AND path = `/login` → redirect to `/`.
- Runs on the Edge runtime → verification must use Web Crypto (no `node:crypto`).

### API routes (Node runtime)
- `POST /api/auth/login` — body `{ username, password }`. On `checkCredentials` pass: set the signed `admin_session` cookie, return `{ ok: true }`. On fail: 401 `{ error: "Sai tài khoản hoặc mật khẩu" }`.
- `POST /api/auth/logout` — clears the `admin_session` cookie, returns `{ ok: true }`.

### Layout restructure (route group)
The root layout currently wraps every route in sidebar + topbar, which would nest the login page inside the dashboard chrome. Fix:
- Move all existing admin pages into a `(dashboard)` route group with its own `layout.tsx` that renders `<AdminSidebar/>` + `<AdminTopbar/>` + `<main>`.
- The root `layout.tsx` keeps only `<html><body>` + fonts (no sidebar/topbar).
- `/login` lives OUTSIDE the group, so it renders full-screen without dashboard chrome.
- Route groups do not appear in the URL, so all existing paths (`/`, `/orders`, `/products`, …) are unchanged.

### UI
- `apps/admin/src/app/login/page.tsx` — full-screen centered card: Tutu logo, username field, password field, submit button, inline error. On submit → `POST /api/auth/login`; success → `router.push("/")` + `router.refresh()`; failure → show error. Submit disabled until both fields are non-empty.
- Logout: a button in `AdminTopbar` (near the "CO" avatar) → `POST /api/auth/logout` → `router.push("/login")`.

## Error handling

| Case | Behavior |
|---|---|
| Wrong username/password | Login form shows "Sai tài khoản hoặc mật khẩu"; no cookie set |
| Empty field | Submit button disabled until both filled |
| Expired/forged cookie | Middleware treats as unauthenticated → redirect to `/login` |
| `ADMIN_SESSION_SECRET` unset (dev) | Fixed dev default + `console.warn`; no crash |

## Testing / verification (Playwright, real admin)

1. Not logged in → visiting `/` and `/orders` redirects to `/login`.
2. Wrong password → error shown, still on `/login`, no `admin_session` cookie.
3. Correct `tutukidswear` / `Admin123` → cookie set, lands on `/` with dashboard + sidebar visible.
4. Logged in → visiting `/login` redirects to `/`.
5. Click logout → cookie cleared → back on `/login`; visiting `/orders` is blocked again.
6. `/api/cron/daily-report` (and the other cron routes) remain reachable (not redirected by middleware).
7. `npm run typecheck` + `npm run lint` clean.

## Non-goals

- No multi-user accounts, roles, or password reset (single shared admin credential).
- No API-level auth (pages only, per decision).
- No changes to the storefront (user app) or its order-creation API.
- No rate-limiting / lockout on failed logins (single-tenant small shop; can add later).
