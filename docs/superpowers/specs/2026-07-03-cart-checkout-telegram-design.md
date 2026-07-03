# Cart + Checkout → Admin + Telegram — Design

Date: 2026-07-03

## Goal
Add a real shopping cart to the user storefront. On checkout, the order is (1)
saved to the shared MongoDB (so it appears in admin) and (2) sent to a Telegram
bot. Cart lives in the browser (localStorage). No login.

## Part 1 — Cart (browser / localStorage)

**Boundary decision:** shared components (ProductCard, SiteHeader) live in
`@repo/ui` and are used by server components (homepage, category), so a server
component CANNOT pass a function prop like `onAdd` to them. Passing callbacks
across the server→client boundary is invalid. Therefore the cart Context lives in
`@repo/ui` itself (app-agnostic, `"use client"`), and shared components consume it
via `useCart()`. The user app renders the Provider. This keeps `@repo/ui` free of
any user-app import while letting shared client components read/update the cart.

`packages/ui/src/components/cart/CartContext.tsx` (`"use client"`) — React Context
+ localStorage.
- **Item shape:** `{ href: string; name: string; img: string; price: number; qty: number }`.
  `price` is numeric VND (parsed from the formatted `sale` string, e.g.
  "199.000 ₫" → 199000).
- **Persistence:** localStorage key `cocandy-cart`; hydrate on mount, write on change.
- **API:** `addItem(item, qty=1)`, `removeItem(href)`, `setQty(href, qty)`,
  `clear()`, plus derived `items`, `totalQty`, `totalPrice`.
- Exports `CartProvider` and `useCart()`. `useCart()` returns a safe no-op
  default when no Provider is mounted (so `@repo/ui` components never crash in
  contexts without a cart).
- Exported via `@repo/ui` package `exports` (`./components/cart/*`).
- A `parsePriceVnd(sale: string): number` helper (in `@repo/ui/lib`) converts
  the formatted price to a number.

**Provider** wraps `apps/user/src/app/layout.tsx` so all user pages share one cart.

**Add-to-cart wiring (existing UI, real behavior):**
- `packages/ui/src/components/ProductCard.tsx` — "Thêm nhanh vào giỏ +" and the
  size buttons call `useCart().addItem` (already `"use client"`).
- PDP `apps/user/src/components/pdp/ProductDetail.tsx` — "Thêm vào giỏ hàng" adds
  current product×qty; "Mua ngay" adds then routes to `/checkout`.

**Header badge:** `packages/ui/src/components/SiteHeader.tsx` cart badge reads
`useCart().totalQty`. SiteHeader is already a client component. Shows 0 when no
Provider (e.g. admin app doesn't use SiteHeader anyway).

## Part 2 — Checkout uses cart + saves order

**CartSummary** (`apps/user/src/components/checkout/CartSummary.tsx`) reads the
cart: lists each line (img, name, qty, price), computes Tạm tính (sum), adds
Phí giao hàng 30.000 ₫, shows Tổng tiền. Empty state when cart is empty.

**Extend order types** (`packages/ui/src/lib/db/types.ts`):
- `OrderDoc` / `OrderInput` gain: `customerPhone: string`, `address: string`,
  `province: string`, `district: string`, `ward: string`, `note: string`,
  `paymentMethod: "cod" | "qr"`. Keep existing `items`, `total`, `customerName`,
  `customerEmail`, `status`, `createdAt`. `customerEmail` becomes optional.
- `SHIPPING_FEE = 30000` constant; `createOrder` computes
  `total = sum(items) + SHIPPING_FEE`.

**OrderForm** (`apps/user/src/components/checkout/OrderForm.tsx`) submits the real
cart:
- Controlled fields already exist for name/phone/email/address; add province/
  district/ward/note/payment (payment state already present as `cod|qr`).
- Validate: name, phone, address required AND cart not empty.
- Build `OrderInput` from form + `cart.items`; `POST /api/orders`.
- On success: `clear()` cart, show success message + order id.

Order "bắn về admin" = persisted in shared MongoDB; visible via existing
`GET /api/orders`. (Admin Orders table UI is out of scope.)

## Part 3 — Telegram notification

`packages/ui/src/lib/notify/telegram.ts` (server-only, no mongodb import):
- `sendOrderToTelegram(order: OrderDoc): Promise<void>`.
- Reads `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` from env. If either is
  missing → log and return (no-op).
- POSTs to `https://api.telegram.org/bot<TOKEN>/sendMessage` with a Vietnamese
  message: order id, name/phone/email, full address, payment method, item lines
  (name ×qty = money), total, note.
- Wrapped so any network/API error is caught and logged — never throws.

**`POST /api/orders` flow** (`apps/user/src/app/api/orders/route.ts`), order matters:
1. `createOrder()` → save to MongoDB FIRST (this is the admin feed).
2. `try { await sendOrderToTelegram(order) } catch { /* log only */ }`.
3. Return `{ order }` 201.

So a Telegram failure never loses the order and never fails the request.

## Environment
Add to `apps/user/.env.local` (and Vercel env for the user project):
```
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...
```
Document in `docs/DATABASE.md`. No secret committed.

## Data flow
```
User: add to cart (localStorage) → /checkout → fill form → Thanh Toán
  → POST /api/orders
       (1) save MongoDB  → shows in Admin (GET /api/orders)
       (2) send Telegram bot (best-effort)
  → clear cart, show success + order id
```

## Out of scope (YAGNI)
- Auth, multi-device cart, real online payment (QR is just a selected method),
  admin Orders table UI, coupon codes, inventory decrement.

## Verification
- Typecheck + build pass across workspaces (Telegram/DB lazy — no network at build).
- Manual: add items → cart badge/summary update → checkout → order in DB (GET
  /api/orders) → Telegram message received (when env set) → cart cleared.
- Telegram env unset → order still saves, request still 201.
