# Cart + Checkout → Admin + Telegram Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a browser cart to the storefront; on checkout, save the order to MongoDB (visible in admin) and send it to a Telegram bot.

**Architecture:** Cart state = React Context + localStorage, defined in `@repo/ui` so shared client components (ProductCard, SiteHeader) consume it via `useCart()`; the user app mounts the Provider. Checkout POSTs the real cart to `/api/orders`, which saves to Mongo first, then best-effort notifies Telegram.

**Tech Stack:** Next.js 16 (App Router, React 19), TypeScript strict, Tailwind v4, MongoDB driver, Telegram Bot HTTP API (fetch).

## Global Constraints

- TypeScript strict, no `any`; named exports; 2-space indent; Tailwind utilities, no inline styles.
- Do NOT commit secrets. Telegram creds via `process.env.TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID`.
- `@repo/ui` must not import from `apps/*`. Shared cart lives in `@repo/ui`.
- DB/Telegram access is lazy — `next build` must pass with no network. Verify each task with `npx tsc --noEmit` (per app/pkg) and, at the end, `npm run build`.
- Order route order of operations: save Mongo FIRST, then Telegram in try/catch (never throws, never blocks the 201).
- Shipping fee constant: `SHIPPING_FEE = 30000` (VND).

---

### Task 1: Price parser + cart types in `@repo/ui`

**Files:**
- Create: `packages/ui/src/lib/cart.ts`

**Interfaces:**
- Produces: `export interface CartItem { href: string; name: string; img: string; price: number; qty: number }`; `export function parsePriceVnd(sale: string): number`.

- [ ] **Step 1: Write the file**

```ts
// packages/ui/src/lib/cart.ts
// Shared cart types + helpers (no React, no DOM — safe to import anywhere).

export interface CartItem {
  href: string;
  name: string;
  img: string;
  /** Numeric VND price. */
  price: number;
  qty: number;
}

/** Parse a formatted VND price like "199.000 ₫" into 199000. */
export function parsePriceVnd(sale: string): number {
  const digits = (sale ?? "").replace(/[^\d]/g, "");
  return digits ? Number(digits) : 0;
}

/** Format a numeric VND price like 199000 into "199.000 ₫". */
export function formatVnd(price: number): string {
  return `${price.toLocaleString("vi-VN")} ₫`;
}
```

- [ ] **Step 2: Typecheck**

Run: `cd /home/huytu20/Documents/ai-website-cloner-template/packages/ui && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd /home/huytu20/Documents/ai-website-cloner-template
git add packages/ui/src/lib/cart.ts
git commit -m "feat(cart): add shared CartItem type + price helpers"
```

---

### Task 2: Cart Context (Provider + useCart) in `@repo/ui`

**Files:**
- Create: `packages/ui/src/components/cart/CartContext.tsx`
- Modify: `packages/ui/package.json` (add `./components/cart/*` export)

**Interfaces:**
- Consumes: `CartItem`, `parsePriceVnd` from `@repo/ui/lib/cart` (Task 1).
- Produces:
  - `export function CartProvider({ children }: { children: React.ReactNode }): JSX.Element`
  - `export function useCart(): { items: CartItem[]; totalQty: number; totalPrice: number; addItem: (item: Omit<CartItem,"qty">, qty?: number) => void; removeItem: (href: string) => void; setQty: (href: string, qty: number) => void; clear: () => void }`
  - `useCart()` returns safe no-op defaults when no Provider is mounted.

- [ ] **Step 1: Add the package export**

In `packages/ui/package.json`, inside `"exports"`, after the `"./components/ui/*"` line add:

```json
    "./components/cart/*": "./src/components/cart/*.tsx",
```

- [ ] **Step 2: Write the Context**

```tsx
// packages/ui/src/components/cart/CartContext.tsx
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CartItem } from "../../lib/cart";

interface CartApi {
  items: CartItem[];
  totalQty: number;
  totalPrice: number;
  addItem: (item: Omit<CartItem, "qty">, qty?: number) => void;
  removeItem: (href: string) => void;
  setQty: (href: string, qty: number) => void;
  clear: () => void;
}

const noop = () => {};
const CartContext = createContext<CartApi>({
  items: [],
  totalQty: 0,
  totalPrice: 0,
  addItem: noop,
  removeItem: noop,
  setQty: noop,
  clear: noop,
});

const STORAGE_KEY = "cocandy-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
    } catch {
      // ignore corrupt storage
    }
    setHydrated(true);
  }, []);

  // Persist after hydration.
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore quota errors
    }
  }, [items, hydrated]);

  const api = useMemo<CartApi>(() => {
    return {
      items,
      totalQty: items.reduce((n, i) => n + i.qty, 0),
      totalPrice: items.reduce((n, i) => n + i.price * i.qty, 0),
      addItem: (item, qty = 1) =>
        setItems((cur) => {
          const found = cur.find((i) => i.href === item.href);
          if (found) {
            return cur.map((i) =>
              i.href === item.href ? { ...i, qty: i.qty + qty } : i,
            );
          }
          return [...cur, { ...item, qty }];
        }),
      removeItem: (href) =>
        setItems((cur) => cur.filter((i) => i.href !== href)),
      setQty: (href, qty) =>
        setItems((cur) =>
          qty <= 0
            ? cur.filter((i) => i.href !== href)
            : cur.map((i) => (i.href === href ? { ...i, qty } : i)),
        ),
      clear: () => setItems([]),
    };
  }, [items]);

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}

export function useCart(): CartApi {
  return useContext(CartContext);
}
```

- [ ] **Step 3: Typecheck**

Run: `cd /home/huytu20/Documents/ai-website-cloner-template/packages/ui && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
cd /home/huytu20/Documents/ai-website-cloner-template
git add packages/ui/src/components/cart/CartContext.tsx packages/ui/package.json
git commit -m "feat(cart): add CartProvider + useCart context (localStorage)"
```

---

### Task 3: Mount CartProvider in user app layout

**Files:**
- Modify: `apps/user/src/app/layout.tsx`

**Interfaces:**
- Consumes: `CartProvider` from `@repo/ui/components/cart/CartContext` (Task 2).

- [ ] **Step 1: Import the provider**

At the top of `apps/user/src/app/layout.tsx`, after the existing imports, add:

```tsx
import { CartProvider } from "@repo/ui/components/cart/CartContext";
```

- [ ] **Step 2: Wrap children**

In the returned JSX, wrap the `{children}` (inside `<body>`) with `<CartProvider>`:

```tsx
        <CartProvider>{children}</CartProvider>
```

(Replace the bare `{children}` that sits inside the body element.)

- [ ] **Step 3: Typecheck**

Run: `cd /home/huytu20/Documents/ai-website-cloner-template/apps/user && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
cd /home/huytu20/Documents/ai-website-cloner-template
git add apps/user/src/app/layout.tsx
git commit -m "feat(cart): mount CartProvider in user layout"
```

---

### Task 4: Wire ProductCard "add to cart"

**Files:**
- Modify: `packages/ui/src/components/ProductCard.tsx`

**Interfaces:**
- Consumes: `useCart` (Task 2), `parsePriceVnd` (Task 1).

- [ ] **Step 1: Add imports**

At the top of `ProductCard.tsx` (already `"use client"`), after the existing `import type { Product }` line add:

```tsx
import { useCart } from "./cart/CartContext";
import { parsePriceVnd } from "../lib/cart";
```

- [ ] **Step 2: Use the cart in the component**

Inside `export function ProductCard(...)`, at the top of the body add:

```tsx
  const { addItem } = useCart();
  const add = () =>
    addItem({
      href: product.href,
      name: product.name,
      img: product.img,
      price: parsePriceVnd(product.sale),
    });
```

- [ ] **Step 3: Wire the quick-add UI**

Replace the size buttons' handler in the hover panel. The buttons currently call
`onClick={(e) => e.preventDefault()}`. Change each size button to:

```tsx
                  onClick={(e) => {
                    e.preventDefault();
                    add();
                  }}
```

And wrap the whole "Thêm nhanh vào giỏ +" `<p>` region so the label is clickable —
change the `<p className="text-center text-[14px] font-bold text-black">` element
to a button:

```tsx
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                add();
              }}
              className="w-full text-center text-[14px] font-bold text-black"
            >
              Thêm nhanh vào giỏ +
            </button>
```

- [ ] **Step 4: Typecheck**

Run: `cd /home/huytu20/Documents/ai-website-cloner-template/packages/ui && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
cd /home/huytu20/Documents/ai-website-cloner-template
git add packages/ui/src/components/ProductCard.tsx
git commit -m "feat(cart): ProductCard quick-add wires to cart"
```

---

### Task 5: Header cart badge shows live count

**Files:**
- Modify: `packages/ui/src/components/SiteHeader.tsx:126-131`

**Interfaces:**
- Consumes: `useCart` (Task 2).

- [ ] **Step 1: Import useCart**

At the top of `SiteHeader.tsx` (already `"use client"`), add near the other imports:

```tsx
import { useCart } from "./cart/CartContext";
```

- [ ] **Step 2: Read totalQty**

Inside `export function SiteHeader(...)` body top, add:

```tsx
  const { totalQty } = useCart();
```

- [ ] **Step 3: Render the count**

Replace the hardcoded badge (currently the `<span>…0…</span>` at lines ~128-130) with:

```tsx
            <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#facc15] px-1 text-[10px] font-bold text-black">
              {totalQty}
            </span>
```

- [ ] **Step 4: Typecheck**

Run: `cd /home/huytu20/Documents/ai-website-cloner-template/packages/ui && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
cd /home/huytu20/Documents/ai-website-cloner-template
git add packages/ui/src/components/SiteHeader.tsx
git commit -m "feat(cart): header badge shows live cart count"
```

---

### Task 6: PDP add-to-cart + buy-now

**Files:**
- Modify: `apps/user/src/components/pdp/ProductDetail.tsx`

**Interfaces:**
- Consumes: `useCart` (Task 2), `parsePriceVnd` (Task 1). Uses `useRouter` from `next/navigation`.
- Note: `ProductDetail` already receives `data?: ProductDetailData` (name/sale/gallery). Use `name`, `sale`, and `gallery[0]` for the cart item; build `href` — the PDP knows its slug via the current pathname. Simplest: read it from `data` if present, else fall back to `pdpProduct`. Add an optional `href` to `ProductDetailData`.

- [ ] **Step 1: Add href to ProductDetailData and imports**

In `ProductDetail.tsx`, extend the interface:

```tsx
export interface ProductDetailData {
  name?: string;
  orig?: string;
  sale?: string;
  discPct?: string;
  gallery?: string[];
  href?: string;
}
```

Add imports near the top (already `"use client"`):

```tsx
import { useRouter } from "next/navigation";
import { useCart } from "@repo/ui/components/cart/CartContext";
import { parsePriceVnd } from "@repo/ui/lib/cart";
```

- [ ] **Step 2: Build the cart handlers**

Inside the component body, after the existing `const [qty, setQty] = useState(1);` line, add:

```tsx
  const router = useRouter();
  const { addItem } = useCart();
  const href = data?.href ?? "/products/ao-coc-cotton-van-mong-nau-tay-raclan";
  const addToCart = () =>
    addItem(
      { href, name, img: gallery[0], price: parsePriceVnd(sale) },
      qty,
    );
  const buyNow = () => {
    addToCart();
    router.push("/checkout");
  };
```

- [ ] **Step 3: Wire the buttons**

Change the two buttons in the "Buttons" block:

```tsx
          <button
            type="button"
            onClick={addToCart}
            className="flex-1 rounded bg-[#e3e3e3] py-3 text-[16px] text-black hover:bg-[#d5d5d5]"
          >
            Thêm vào giỏ hàng
          </button>
          <button
            type="button"
            onClick={buyNow}
            className="flex-1 rounded bg-[#e3e3e3] py-3 text-[16px] text-black hover:bg-[#d5d5d5]"
          >
            Mua ngay
          </button>
```

- [ ] **Step 4: Pass href from the PDP page**

In `apps/user/src/app/products/[slug]/page.tsx`, in the `data` object passed to
`<ProductDetail data={...} />`, add `href`:

```tsx
        href: doc.href,
```

(Add it inside the `data` object literal alongside `name`, `sale`, etc. When `doc`
is null, `data` is `undefined` and ProductDetail uses its fallback href.)

- [ ] **Step 5: Typecheck**

Run: `cd /home/huytu20/Documents/ai-website-cloner-template/apps/user && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
cd /home/huytu20/Documents/ai-website-cloner-template
git add apps/user/src/components/pdp/ProductDetail.tsx apps/user/src/app/products/[slug]/page.tsx
git commit -m "feat(cart): PDP add-to-cart and buy-now"
```

---

### Task 7: Extend order types + createOrder (new fields + shipping)

**Files:**
- Modify: `packages/ui/src/lib/db/types.ts`
- Modify: `packages/ui/src/lib/db/repositories/orders.ts`

**Interfaces:**
- Produces: extended `OrderInput` / `OrderDoc` with `customerPhone`, `address`, `province`, `district`, `ward`, `note`, `paymentMethod`; `customerEmail` optional. `SHIPPING_FEE` used in `createOrder`.

- [ ] **Step 1: Extend types**

In `packages/ui/src/lib/db/types.ts`, replace the `OrderDoc` and `OrderInput` blocks with:

```ts
export interface OrderDoc {
  _id: string;
  items: OrderItem[];
  total: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  address: string;
  province: string;
  district: string;
  ward: string;
  note: string;
  paymentMethod: "cod" | "qr";
  status: "pending" | "paid" | "shipped" | "cancelled";
  createdAt: string;
}

export type OrderInput = {
  items: OrderItem[];
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  address: string;
  province: string;
  district: string;
  ward: string;
  note: string;
  paymentMethod: "cod" | "qr";
};
```

- [ ] **Step 2: Update createOrder**

In `packages/ui/src/lib/db/repositories/orders.ts`, replace `createOrder` with:

```ts
/** Flat shipping fee added to every order (VND). */
export const SHIPPING_FEE = 30000;

export async function createOrder(input: OrderInput): Promise<OrderDoc> {
  const col = await ordersCollection();
  const itemsTotal = input.items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const toInsert = {
    items: input.items,
    total: itemsTotal + SHIPPING_FEE,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    customerEmail: input.customerEmail ?? "",
    address: input.address,
    province: input.province,
    district: input.district,
    ward: input.ward,
    note: input.note,
    paymentMethod: input.paymentMethod,
    status: "pending" as const,
    createdAt: new Date().toISOString(),
  };
  const result = await col.insertOne(toInsert);
  return { _id: String(result.insertedId), ...toInsert };
}
```

- [ ] **Step 3: Typecheck**

Run: `cd /home/huytu20/Documents/ai-website-cloner-template/packages/ui && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
cd /home/huytu20/Documents/ai-website-cloner-template
git add packages/ui/src/lib/db/types.ts packages/ui/src/lib/db/repositories/orders.ts
git commit -m "feat(order): extend order fields + shipping fee"
```

---

### Task 8: Telegram notifier

**Files:**
- Create: `packages/ui/src/lib/notify/telegram.ts`
- Modify: `packages/ui/package.json` (add `./lib/notify/*` export)

**Interfaces:**
- Consumes: `OrderDoc` (Task 7), `formatVnd` (Task 1).
- Produces: `export async function sendOrderToTelegram(order: OrderDoc): Promise<void>` — never throws.

**Security note:** the bot token appears ONLY in the Telegram API URL path
(`.../bot${token}/sendMessage`) — this is the required Bot API format, server-side
only, never sent to the client. NEVER log the token value; error logs must include
only HTTP status / response text, never `token`.

- [ ] **Step 1: Add the package export**

In `packages/ui/package.json` `"exports"`, add:

```json
    "./lib/notify/*": "./src/lib/notify/*.ts",
```

- [ ] **Step 2: Write the notifier**

```ts
// packages/ui/src/lib/notify/telegram.ts
// Server-only: sends an order summary to a Telegram bot. Best-effort — reads
// creds from env, catches/logs all errors, never throws.
import type { OrderDoc } from "../db/types";
import { formatVnd } from "../cart";

function buildMessage(order: OrderDoc): string {
  const lines = order.items
    .map((i) => `• ${i.name} ×${i.qty} = ${formatVnd(i.price * i.qty)}`)
    .join("\n");
  const address = [order.address, order.ward, order.district, order.province]
    .filter(Boolean)
    .join(", ");
  const pay = order.paymentMethod === "qr" ? "Chuyển khoản QR" : "COD";
  return [
    "🛒 <b>ĐƠN HÀNG MỚI</b>",
    `Mã: ${order._id}`,
    `Khách: ${order.customerName}`,
    `SĐT: ${order.customerPhone}`,
    order.customerEmail ? `Email: ${order.customerEmail}` : "",
    `Địa chỉ: ${address}`,
    `Thanh toán: ${pay}`,
    order.note ? `Ghi chú: ${order.note}` : "",
    "",
    "<b>Sản phẩm:</b>",
    lines,
    "",
    `<b>Tổng tiền: ${formatVnd(order.total)}</b>`,
  ]
    .filter((l) => l !== "")
    .join("\n");
}

export async function sendOrderToTelegram(order: OrderDoc): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.warn("[telegram] missing TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID; skipping");
    return;
  }
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: buildMessage(order),
          parse_mode: "HTML",
        }),
      },
    );
    if (!res.ok) {
      console.error("[telegram] sendMessage failed", res.status, await res.text());
    }
  } catch (err) {
    console.error("[telegram] request error", err);
  }
}
```

- [ ] **Step 3: Typecheck**

Run: `cd /home/huytu20/Documents/ai-website-cloner-template/packages/ui && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
cd /home/huytu20/Documents/ai-website-cloner-template
git add packages/ui/src/lib/notify/telegram.ts packages/ui/package.json
git commit -m "feat(notify): add best-effort Telegram order notifier"
```

---

### Task 9: Update POST /api/orders (validate new fields + notify)

**Files:**
- Modify: `apps/user/src/app/api/orders/route.ts`

**Interfaces:**
- Consumes: `createOrder` (Task 7), `sendOrderToTelegram` (Task 8), `OrderInput` (Task 7).

- [ ] **Step 1: Replace the route**

```ts
import { NextResponse } from "next/server";
import { createOrder } from "@repo/ui/lib/db/repositories/orders";
import { sendOrderToTelegram } from "@repo/ui/lib/notify/telegram";
import type { OrderInput } from "@repo/ui/lib/db/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as OrderInput;
    if (
      !body.items?.length ||
      !body.customerName ||
      !body.customerPhone ||
      !body.address
    ) {
      return NextResponse.json(
        { error: "Thiếu thông tin đơn hàng bắt buộc" },
        { status: 400 },
      );
    }
    // 1. Save to Mongo first — this is the admin feed.
    const order = await createOrder(body);
    // 2. Notify Telegram (best-effort; never blocks or fails the response).
    try {
      await sendOrderToTelegram(order);
    } catch (err) {
      console.error("[orders] telegram notify failed", err);
    }
    return NextResponse.json({ order }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Không thể tạo đơn hàng" },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 2: Typecheck**

Run: `cd /home/huytu20/Documents/ai-website-cloner-template/apps/user && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd /home/huytu20/Documents/ai-website-cloner-template
git add apps/user/src/app/api/orders/route.ts
git commit -m "feat(order): validate full fields + notify telegram on create"
```

---

### Task 10: CartSummary reads the cart

**Files:**
- Modify: `apps/user/src/components/checkout/CartSummary.tsx`

**Interfaces:**
- Consumes: `useCart` (Task 2), `formatVnd` (Task 1), `SHIPPING_FEE` — hardcode 30000 here to avoid importing the mongodb-backed repo into a client component.

- [ ] **Step 1: Rewrite CartSummary as a client component**

```tsx
"use client";

import { useCart } from "@repo/ui/components/cart/CartContext";
import { formatVnd } from "@repo/ui/lib/cart";

const SHIPPING_FEE = 30000;

export function CartSummary() {
  const { items, totalPrice } = useCart();
  const isEmpty = items.length === 0;
  const grand = isEmpty ? 0 : totalPrice + SHIPPING_FEE;

  return (
    <div>
      <h2 className="font-display mb-4 text-[26px] font-bold text-black">
        Giỏ hàng
      </h2>

      <div className="flex justify-between border-b pb-2 text-[12px] uppercase text-[#999]">
        <span>Tất cả sản phẩm</span>
        <span>Số lượng</span>
        <span>Giá</span>
      </div>

      {isEmpty ? (
        <div className="py-10 text-center">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#f3f3f3]">
            <span className="text-4xl" aria-hidden>
              🏷️
            </span>
          </div>
          <p className="mt-3 text-[15px] text-[#999]">Chưa có sản phẩm nào</p>
        </div>
      ) : (
        <ul className="divide-y">
          {items.map((it) => (
            <li key={it.href} className="flex items-center gap-3 py-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={it.img}
                alt={it.name}
                className="h-14 w-14 shrink-0 rounded-md object-cover"
              />
              <span className="flex-1 text-[14px] text-black">{it.name}</span>
              <span className="w-10 text-center text-[14px] text-black">
                x{it.qty}
              </span>
              <span className="w-24 text-right text-[14px] font-semibold text-[#c2864e]">
                {formatVnd(it.price * it.qty)}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex gap-2">
        <input
          placeholder="Nhập mã giảm giá"
          className="flex-1 rounded-full border border-black/15 px-4 py-2.5 text-[14px] outline-none focus:border-[#b08560] placeholder:text-black/40"
        />
        <button type="button" className="rounded bg-[#e3e3e3] px-5 text-black">
          Áp dụng
        </button>
      </div>

      <div className="mt-6 space-y-2 text-[15px]">
        <div className="flex justify-between">
          <span>Tạm tính</span>
          <span>{formatVnd(isEmpty ? 0 : totalPrice)}</span>
        </div>
        <div className="flex justify-between">
          <span>Giảm giá</span>
          <span>0 ₫</span>
        </div>
        <div className="flex justify-between">
          <span>Giá giao hàng</span>
          <span>{formatVnd(isEmpty ? 0 : SHIPPING_FEE)}</span>
        </div>
        <div className="flex justify-between border-t pt-3">
          <span className="font-bold">Tổng tiền</span>
          <span className="text-[18px] font-bold">{formatVnd(grand)}</span>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `cd /home/huytu20/Documents/ai-website-cloner-template/apps/user && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd /home/huytu20/Documents/ai-website-cloner-template
git add apps/user/src/components/checkout/CartSummary.tsx
git commit -m "feat(checkout): CartSummary reads live cart"
```

---

### Task 11: OrderForm submits the real cart

**Files:**
- Modify: `apps/user/src/components/checkout/OrderForm.tsx`

**Interfaces:**
- Consumes: `useCart` (Task 2), `OrderInput` (Task 7). Uses existing `payment` state (`cod|qr`), existing name/phone/email/address states.
- Note: the three `SelectField` components (province/district/ward) currently have no state. Add `province`, `district`, `ward`, `note` states and make `SelectField`/textarea controlled.

- [ ] **Step 1: Add imports + cart/new state**

At the top, add:

```tsx
import { useCart } from "@repo/ui/components/cart/CartContext";
import type { OrderInput } from "@repo/ui/lib/db/types";
```

Make `SelectField` controlled — change its signature and markup to:

```tsx
function SelectField({
  placeholder,
  options,
  value,
  onChange,
}: {
  placeholder: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputClass} appearance-none pr-10`}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
    </div>
  );
}
```

- [ ] **Step 2: Add state + submit handler**

Inside `OrderForm`, replace the existing state block (name/phone/email/address/submitting/message) so it also has province/district/ward/note and pulls the cart:

```tsx
  const { items, clear } = useCart();
  const [payment, setPayment] = useState<Payment>("cod");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [ward, setWard] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  async function placeOrder() {
    setMessage(null);
    if (!name.trim() || !phone.trim() || !address.trim()) {
      setMessage({ kind: "error", text: "Vui lòng nhập Họ tên, Số điện thoại và Địa chỉ." });
      return;
    }
    if (items.length === 0) {
      setMessage({ kind: "error", text: "Giỏ hàng đang trống." });
      return;
    }
    const payload: OrderInput = {
      items: items.map((i) => ({ name: i.name, price: i.price, qty: i.qty })),
      customerName: name.trim(),
      customerPhone: phone.trim(),
      customerEmail: email.trim() || undefined,
      address: address.trim(),
      province,
      district,
      ward,
      note: note.trim(),
      paymentMethod: payment,
    };
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Không thể tạo đơn hàng");
      }
      const data = (await res.json()) as { order: { _id: string } };
      setMessage({ kind: "ok", text: `Đặt hàng thành công! Mã đơn: ${data.order._id}` });
      clear();
      setName(""); setPhone(""); setEmail(""); setAddress("");
      setProvince(""); setDistrict(""); setWard(""); setNote("");
    } catch (err) {
      setMessage({ kind: "error", text: err instanceof Error ? err.message : "Không thể tạo đơn hàng" });
    } finally {
      setSubmitting(false);
    }
  }
```

- [ ] **Step 3: Bind the province/district/ward selects + note textarea + button**

Update the three `SelectField` usages:

```tsx
          <SelectField placeholder="Tỉnh/Thành phố" options={["Hà Nội", "TP. Hồ Chí Minh"]} value={province} onChange={setProvince} />
          <SelectField placeholder="Quận/Huyện" options={["Quận 1", "Quận 2"]} value={district} onChange={setDistrict} />
          <SelectField placeholder="Phường/Xã" options={["Phường 1", "Phường 2"]} value={ward} onChange={setWard} />
```

Bind the note textarea (the existing `<textarea rows={3} ...>`): add
`value={note} onChange={(e) => setNote(e.target.value)}`.

Bind the submit button (existing "Thanh Toán" `<button>`): add
`onClick={placeOrder} disabled={submitting}` and text
`{submitting ? "Đang xử lý..." : "Thanh Toán"}`, plus append the message block
above it:

```tsx
      {message ? (
        <p
          className={
            "mt-4 rounded-lg px-4 py-3 text-[14px] " +
            (message.kind === "ok" ? "bg-[#ecfdf3] text-[#027a48]" : "bg-[#fef3f2] text-[#b42318]")
          }
        >
          {message.text}
        </p>
      ) : null}
```

- [ ] **Step 4: Typecheck**

Run: `cd /home/huytu20/Documents/ai-website-cloner-template/apps/user && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
cd /home/huytu20/Documents/ai-website-cloner-template
git add apps/user/src/components/checkout/OrderForm.tsx
git commit -m "feat(checkout): submit real cart + full fields to /api/orders"
```

---

### Task 12: Docs + full build + manual verification

**Files:**
- Modify: `docs/DATABASE.md`

- [ ] **Step 1: Document Telegram env**

Append to `docs/DATABASE.md`:

```markdown
## Telegram order notifications

Set these on the user app (`apps/user/.env.local`) and Vercel (user project):

```
TELEGRAM_BOT_TOKEN=...   # from @BotFather
TELEGRAM_CHAT_ID=...      # your chat/group id
```

On checkout the order is saved to MongoDB (shows in admin) and then sent to the
Telegram chat. If the vars are unset or the send fails, the order is still saved
and the customer still sees success.
```

- [ ] **Step 2: Full monorepo build**

Run: `cd /home/huytu20/Documents/ai-website-cloner-template && npm run build`
Expected: `Tasks: 2 successful`.

- [ ] **Step 3: Manual verification (dev)**

Run: `npm run dev:user`, then in the browser:
- Add a product from a card and the PDP → header badge count increases.
- Go to `/checkout` → CartSummary lists items + Tạm tính + 30.000 ₫ ship + Tổng tiền.
- Fill name/phone/address, choose payment, click Thanh Toán →
  success message with order id; cart clears (badge → 0).
- `curl http://localhost:3001/api/orders` (admin dev) shows the order with all fields.
- If `TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID` set in `apps/user/.env.local`,
  the Telegram chat receives the order message.
- With Telegram vars unset: order still saves, response still 201.

- [ ] **Step 4: Commit docs**

```bash
cd /home/huytu20/Documents/ai-website-cloner-template
git add docs/DATABASE.md
git commit -m "docs: document Telegram order-notification env"
```

---

## Self-Review

**Spec coverage:**
- Part 1 (cart): Tasks 1–6 ✓ (types/helpers, Context, provider mount, ProductCard, header badge, PDP).
- Part 2 (checkout + save): Tasks 7, 10, 11 ✓ (order types+shipping, CartSummary, OrderForm→/api/orders).
- Part 3 (Telegram): Tasks 8, 9 ✓ (notifier, route save-then-notify).
- Env docs + verification: Task 12 ✓.

**Placeholder scan:** No TBD/TODO; all steps have concrete code.

**Type consistency:** `CartItem`, `useCart` API (`addItem`/`removeItem`/`setQty`/`clear`/`items`/`totalQty`/`totalPrice`), `parsePriceVnd`/`formatVnd`, `OrderInput`/`OrderDoc` (with `customerPhone`,`address`,`province`,`district`,`ward`,`note`,`paymentMethod`), `sendOrderToTelegram(order: OrderDoc)`, `SHIPPING_FEE=30000` used consistently across Tasks 1,2,7,8,9,10,11.

**Known nuance:** CartSummary and OrderForm hardcode `SHIPPING_FEE=30000` client-side (can't import the mongodb-backed repo into a client bundle); `createOrder` also applies it server-side as the source of truth for `total`. Both use the same value.
