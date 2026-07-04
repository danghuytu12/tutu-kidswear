# Storefront Animations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add subtle, professional motion (section reveals, staggered grids, hover/press on cards, icons, and buttons, animated header menus) to the entire `apps/user` storefront, responsive across desktop/tablet/mobile.

**Architecture:** Four reusable client-component primitives (`Reveal`, `StaggerGrid`/`StaggerItem`, `HoverLift`, `MotionButton`) live in `packages/ui/src/components/motion/` and are applied across the storefront. Server Components stay server-rendered — only presentational wrappers are `"use client"`. Animations use `framer-motion`, animating only `opacity`/`transform`.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript strict, Tailwind v4, framer-motion.

## Global Constraints

- Library: `framer-motion`, installed in `packages/ui` (consumed by apps via `transpilePackages: ["@repo/ui"]`).
- Animate only `opacity` and `transform` (no layout shift).
- Reduced-motion is NOT honored — animations always run.
- Do not change data fetching, business logic, or the admin app.
- Section slide distance: 24px at ≥768px, 16px at <768px (via `useMotionDistance()`).
- Card slide 16px; grid `staggerChildren: 0.06`.
- Style is subtle/professional: no parallax, scroll-scrubbing, bounce, or elastic.
- Match existing code style: 2-space indent, named exports, `z-[…]` bracket classes, `cn()` for class merge.
- Imports: shared code via `@repo/ui/...`, app-local via `@/...`.

---

### Task 1: Install framer-motion + create motion primitives

**Files:**
- Modify: `packages/ui/package.json` (add dependency)
- Create: `packages/ui/src/components/motion/useMotionDistance.ts`
- Create: `packages/ui/src/components/motion/Reveal.tsx`
- Create: `packages/ui/src/components/motion/Stagger.tsx`
- Create: `packages/ui/src/components/motion/HoverLift.tsx`
- Create: `packages/ui/src/components/motion/MotionButton.tsx`
- Create: `packages/ui/src/components/motion/index.ts`

**Interfaces:**
- Produces:
  - `useMotionDistance(): number` — returns 16 (<768px) or 24 (≥768px).
  - `Reveal({ children, delay?, className?, as? })` — fade + slide-up on scroll into view.
  - `StaggerGrid({ children, className? })` + `StaggerItem({ children, className? })` — sequential reveal.
  - `HoverLift({ children, className?, lift? })` — hover lift + tap press (for cards/icons).
  - `MotionButton(props: ButtonHTMLAttributes)` — a `<motion.button>` with hover/press scale; motion suppressed when `disabled`.
  - All re-exported from `@repo/ui/components/motion`.

- [ ] **Step 1: Install framer-motion in the UI package**

Run:
```bash
npm install framer-motion --workspace=packages/ui
```
Expected: `added N packages`. Confirm with:
```bash
grep '"framer-motion"' packages/ui/package.json
```
Expected: a line showing the dependency and version.

- [ ] **Step 2: Create the responsive-distance hook**

Create `packages/ui/src/components/motion/useMotionDistance.ts`:
```ts
"use client";

import { useEffect, useState } from "react";

/**
 * Reveal slide distance in px, responsive to viewport width: 16 on phones
 * (<768px), 24 on tablet/desktop. Updates on resize. SSR-safe (defaults to 24).
 */
export function useMotionDistance(): number {
  const [distance, setDistance] = useState(24);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = () => setDistance(mq.matches ? 16 : 24);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return distance;
}
```

- [ ] **Step 3: Create the `Reveal` primitive**

Create `packages/ui/src/components/motion/Reveal.tsx`:
```tsx
"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useMotionDistance } from "./useMotionDistance";

interface RevealProps {
  children: ReactNode;
  /** Seconds to delay the animation start (for sequencing). */
  delay?: number;
  className?: string;
}

/**
 * Fades + slides its children up as they scroll into view. Runs once. Slide
 * distance is responsive (see useMotionDistance).
 */
export function Reveal({ children, delay = 0, className }: RevealProps) {
  const y = useMotionDistance();
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, ease: "easeOut", delay }}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 4: Create the `Stagger` primitives**

Create `packages/ui/src/components/motion/Stagger.tsx`:
```tsx
"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

interface StaggerProps {
  children: ReactNode;
  className?: string;
}

/** Container that reveals its <StaggerItem> children one-by-one on scroll. */
export function StaggerGrid({ children, className }: StaggerProps) {
  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
    >
      {children}
    </motion.div>
  );
}

/** One item inside a <StaggerGrid>. */
export function StaggerItem({ children, className }: StaggerProps) {
  return (
    <motion.div className={className} variants={itemVariants}>
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 5: Create the `HoverLift` primitive**

Create `packages/ui/src/components/motion/HoverLift.tsx`:
```tsx
"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface HoverLiftProps {
  children: ReactNode;
  className?: string;
  /** Pixels to lift on hover (default 4). */
  lift?: number;
}

/** Lifts + slightly scales on hover, presses on tap. For cards and icons. */
export function HoverLift({ children, className, lift = 4 }: HoverLiftProps) {
  return (
    <motion.div
      className={className}
      whileHover={{ y: -lift, scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 6: Create the `MotionButton` primitive**

Create `packages/ui/src/components/motion/MotionButton.tsx`:
```tsx
"use client";

import { motion } from "framer-motion";
import type { ButtonHTMLAttributes } from "react";

type MotionButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * A <button> drop-in with a snappy hover/press scale. When disabled, motion is
 * suppressed so the button feels inert. Forwards all native button props.
 */
export function MotionButton({ disabled, ...props }: MotionButtonProps) {
  return (
    <motion.button
      disabled={disabled}
      whileHover={disabled ? undefined : { scale: 1.04 }}
      whileTap={disabled ? undefined : { scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      {...props}
    />
  );
}
```

- [ ] **Step 7: Create the barrel export**

Create `packages/ui/src/components/motion/index.ts`:
```ts
export { Reveal } from "./Reveal";
export { StaggerGrid, StaggerItem } from "./Stagger";
export { HoverLift } from "./HoverLift";
export { MotionButton } from "./MotionButton";
export { useMotionDistance } from "./useMotionDistance";
```

- [ ] **Step 8: Typecheck + lint**

Run:
```bash
npm run typecheck --workspace=packages/ui && npm run lint --workspace=packages/ui 2>&1 | tail -5
```
Expected: typecheck prints no errors; lint shows 0 errors (warnings from unrelated files are acceptable).

- [ ] **Step 9: Commit**

```bash
git add packages/ui/package.json packages/ui/src/components/motion package-lock.json
git commit -m "feat(ui): add framer-motion primitives (Reveal, Stagger, HoverLift, MotionButton)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Animate shared ProductCard, ProductGrid, ProductCarousel

**Files:**
- Modify: `packages/ui/src/components/ProductGrid.tsx`
- Modify: `packages/ui/src/components/ProductCarousel.tsx`
- Modify: `packages/ui/src/components/ProductCard.tsx:54-82` (the hoverAdd button block)

**Interfaces:**
- Consumes: `StaggerGrid`, `StaggerItem`, `MotionButton` from `@repo/ui/components/motion`.

- [ ] **Step 1: Wrap the ProductGrid grid in StaggerGrid**

In `packages/ui/src/components/ProductGrid.tsx`, add the import at the top (after the existing imports):
```tsx
import { StaggerGrid, StaggerItem } from "@repo/ui/components/motion";
```
Replace the grid `<div>...</div>` block (currently lines 27-36) with:
```tsx
      <StaggerGrid
        className={cn(
          "grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3",
          cols === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3",
        )}
      >
        {products.map((p) => (
          <StaggerItem key={p.href + p.name}>
            <ProductCard product={p} hoverAdd={hoverAdd} />
          </StaggerItem>
        ))}
      </StaggerGrid>
```

- [ ] **Step 2: Wrap the ProductCarousel items in StaggerGrid**

In `packages/ui/src/components/ProductCarousel.tsx`, add the import after the existing imports:
```tsx
import { StaggerGrid, StaggerItem } from "@repo/ui/components/motion";
```
Replace the scroller `<div className="no-scrollbar ...">...</div>` block (currently lines 46-55) with:
```tsx
      <StaggerGrid className="no-scrollbar flex snap-x gap-4 overflow-x-auto pb-2">
        {products.map((p) => (
          <StaggerItem
            key={p.href + p.name}
            className="w-[calc(50%-8px)] shrink-0 snap-start sm:w-[calc(33.333%-11px)] lg:w-[calc(25%-12px)]"
          >
            <ProductCard product={p} hoverAdd={hoverAdd} />
          </StaggerItem>
        ))}
      </StaggerGrid>
```

- [ ] **Step 3: Smooth the ProductCard image zoom + animate the quick-add button**

In `packages/ui/src/components/ProductCard.tsx`, add the import after the existing imports:
```tsx
import { MotionButton } from "@repo/ui/components/motion";
```
On the product `<img>` (line 44-53), add a hover zoom by appending these classes to its existing `className` (keep everything already there): ` transition-transform duration-300 group-hover:scale-105`. The `<img>` sits inside `<div className="group ...">`'s `<a className="group block">`, so `group-hover` works.

Then replace the quick-add `<button>...</button>` (currently lines 56-65) with:
```tsx
            <MotionButton
              type="button"
              onClick={(e) => {
                e.preventDefault();
                add();
              }}
              className="w-full cursor-pointer text-center text-[14px] font-bold text-black"
            >
              Thêm nhanh vào giỏ +
            </MotionButton>
```

- [ ] **Step 4: Typecheck + lint**

Run:
```bash
npm run typecheck --workspace=packages/ui && npm run lint --workspace=packages/ui 2>&1 | grep -cE "error "
```
Expected: typecheck clean; the grep prints `0`.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/ProductGrid.tsx packages/ui/src/components/ProductCarousel.tsx packages/ui/src/components/ProductCard.tsx
git commit -m "feat(ui): stagger product grids/carousels, animate card image + quick-add

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Animate the home page sections

**Files:**
- Modify: `apps/user/src/app/page.tsx:29-73` (wrap sections in `Reveal`)

**Interfaces:**
- Consumes: `Reveal` from `@repo/ui/components/motion`.

**Note:** `page.tsx` is a Server Component. `Reveal` is a client component, but a Server Component may render client components and pass server-rendered children through them — this is allowed and does not make the page a client component.

- [ ] **Step 1: Import Reveal**

In `apps/user/src/app/page.tsx`, add after line 19 (`import { getCatalog, slice } ...`):
```tsx
import { Reveal } from "@repo/ui/components/motion";
```

- [ ] **Step 2: Wrap each content section in `Reveal`**

Replace the JSX from `<ProductTabsSection ... />` through `<RecentlyViewed />` (lines 35-70) with each section wrapped in `Reveal`. Leave `AnnouncementBar`, `SiteHeader`, `HeroCarousel`, `SiteFooter`, `FloatingWidgets` unwrapped (header/footer/hero are above the fold or fixed):
```tsx
      <Reveal>
        <ProductTabsSection
          newList={slice(catalog, 0, 8, newProducts)}
          bestList={slice(catalog, 8, 8, bestsellerProducts)}
        />
      </Reveal>
      <Reveal>
        <PromoBanner
          src="/images/cocandy/banner-1.png"
          href="/categories/bst-do-boi"
        />
      </Reveal>
      <Reveal>
        <ProductCarousel
          title="BST đồ bơi"
          products={slice(catalog, 16, 8, swimProducts)}
          moreHref="/categories/bst-do-boi"
        />
      </Reveal>
      <Reveal>
        <PromoBanner src="/images/cocandy/banner-2.png" href="/categories/bst" />
      </Reveal>
      <Reveal>
        <ProductCarousel
          title="BST ÁO THUN"
          products={slice(catalog, 24, 8, teeProducts)}
          moreHref="/categories/ao"
        />
      </Reveal>
      <Reveal>
        <ProductCarousel
          title="SALE HÈ THU"
          products={slice(catalog, 32, 8, saleHeThuProducts.slice(0, 8))}
          moreHref="/categories/sale-he-thu"
        />
      </Reveal>
      <Reveal>
        <PromoBanner
          src="/images/cocandy/banner-3.png"
          href="/categories/bst-mellow-candy"
        />
      </Reveal>
      <Reveal>
        <ProductCarousel
          title="BST MELLOW CANDY"
          products={slice(catalog, 40, 8, mellowProducts)}
          topRightLabel="Xem thêm"
          topRightHref="/categories/bst-mellow-candy"
          moreHref="/categories/bst-mellow-candy"
        />
      </Reveal>
      <Reveal>
        <RecentlyViewed />
      </Reveal>
```

- [ ] **Step 3: Typecheck + lint**

Run:
```bash
npm run typecheck --workspace=apps/user && npm run lint --workspace=apps/user 2>&1 | grep -cE "error "
```
Expected: typecheck clean; grep prints `0`.

- [ ] **Step 4: Commit**

```bash
git add apps/user/src/app/page.tsx
git commit -m "feat(user): reveal-on-scroll for home page sections

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Animate PDP, category, and checkout screens

**Files:**
- Modify: `apps/user/src/app/products/[slug]/page.tsx` (wrap PDP blocks in `Reveal`)
- Modify: `apps/user/src/components/pdp/ProductDetail.tsx` (animate add-to-cart / buy-now / qty buttons + gallery)
- Modify: `apps/user/src/components/category/CategoryLayout.tsx` (Reveal wrapper — grid already staggers via ProductGrid)
- Modify: `apps/user/src/components/checkout/CheckoutLayout.tsx` (Reveal wrappers)
- Modify: `apps/user/src/components/checkout/OrderForm.tsx` (MotionButton for "Thanh Toán")
- Modify: `apps/user/src/components/checkout/QrPaymentModal.tsx` (MotionButton for "Xác nhận đã chuyển khoản")

**Interfaces:**
- Consumes: `Reveal`, `MotionButton` from `@repo/ui/components/motion`.

**Note:** Before editing each file, open it and confirm the exact button JSX (class strings differ). Preserve every existing `className`, `onClick`, `disabled`, `type`, and text — only change the element from `<button>` to `<MotionButton>` (same props) or wrap a block in `<Reveal>`.

- [ ] **Step 1: PDP page — wrap the description + similar-products blocks in Reveal**

In `apps/user/src/app/products/[slug]/page.tsx`, add to the motion import group at the top:
```tsx
import { Reveal } from "@repo/ui/components/motion";
```
Wrap `<ProductDescription html={data?.description} />` and the `<ProductCarousel title="GỢI Ý SẢN PHẨM" ... />` each in `<Reveal>...</Reveal>`. Leave `ProductDetail` (top of page, above fold) unwrapped.

- [ ] **Step 2: ProductDetail — convert action buttons to MotionButton**

In `apps/user/src/components/pdp/ProductDetail.tsx`, add:
```tsx
import { MotionButton } from "@repo/ui/components/motion";
```
Change the two `<button>` elements for "Thêm vào giỏ hàng" (addToCart) and "Mua ngay" (buyNow), and the two qty-stepper `<button>`s (Minus/Plus), from `<button ...>` to `<MotionButton ...>` — keep every existing prop and child unchanged, only rename the tag (open + close).

- [ ] **Step 3: CategoryLayout — wrap in Reveal**

Open `apps/user/src/components/category/CategoryLayout.tsx`. Add:
```tsx
import { Reveal } from "@repo/ui/components/motion";
```
Wrap the component's returned top-level content (the `<section>`/grid it renders) in a single `<Reveal>...</Reveal>`. The product grid inside already staggers via `ProductGrid` (Task 2), so do not add a second stagger — just the section reveal.

- [ ] **Step 4: CheckoutLayout — wrap the two columns in Reveal**

Open `apps/user/src/components/checkout/CheckoutLayout.tsx`. Add:
```tsx
import { Reveal } from "@repo/ui/components/motion";
```
Wrap the order-form column and the cart-summary column each in `<Reveal>...</Reveal>` (add `delay={0.1}` to the second so they sequence). If the file is a Server Component and renders client children, this is fine.

- [ ] **Step 5: OrderForm + QrPaymentModal — MotionButton for the CTAs**

In `apps/user/src/components/checkout/OrderForm.tsx`, add:
```tsx
import { MotionButton } from "@repo/ui/components/motion";
```
Change the final "Thanh Toán" `<button type="button" onClick={placeOrder} disabled={submitting} ...>` (and its closing tag) to `<MotionButton ...>` — keep all props/children.

In `apps/user/src/components/checkout/QrPaymentModal.tsx`, add the same import and change the "Xác nhận đã chuyển khoản" `<button>` to `<MotionButton>` (keep all props/children).

- [ ] **Step 6: Typecheck + lint**

Run:
```bash
npm run typecheck --workspace=apps/user && npm run lint --workspace=apps/user 2>&1 | grep -cE "error "
```
Expected: typecheck clean; grep prints `0`.

- [ ] **Step 7: Commit**

```bash
git add apps/user/src/app/products apps/user/src/components/pdp apps/user/src/components/category apps/user/src/components/checkout
git commit -m "feat(user): reveal + button motion on PDP, category, checkout

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Animate the header (mega menu + mobile drawer), hero arrows, and floating icons

**Files:**
- Modify: `packages/ui/src/components/SiteHeader.tsx` (mega menu + drawer via `AnimatePresence`)
- Modify: `packages/ui/src/components/FloatingWidgets.tsx:18-45` (wrap each icon anchor in `HoverLift`)
- Modify: `apps/user/src/components/home/HeroCarousel.tsx` (prev/next arrows → `MotionButton`)

**Interfaces:**
- Consumes: `HoverLift`, `MotionButton` from `@repo/ui/components/motion`; `motion`, `AnimatePresence` from `framer-motion`.

**Note on the hero:** the hero's slide transition (`transition-transform duration-500`) is already smooth and stays as-is. Only its two arrow buttons become `MotionButton` (covers the "carousel arrows" item from the spec's button map).

- [ ] **Step 1: FloatingWidgets — wrap icons in HoverLift**

In `packages/ui/src/components/FloatingWidgets.tsx`, add to the imports:
```tsx
import { HoverLift } from "@repo/ui/components/motion";
```
Wrap each of the three social `<a>` anchors (Messenger, Instagram, Zalo) in `<HoverLift>...</HoverLift>`, and remove the now-redundant `transition-transform hover:scale-105` classes from each anchor (HoverLift handles the motion). Keep `href`, `aria-label`, `target`, `rel`, and the icon child unchanged. Leave the scroll-to-top button as-is (it already has a CSS transition).

- [ ] **Step 2: SiteHeader — animate the mega-menu panel**

Open `packages/ui/src/components/SiteHeader.tsx`. Add to the imports:
```tsx
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
```
(`useState` is already imported — do not duplicate; only add `motion, AnimatePresence`.)

The `MegaMenuItem` currently shows its panel via CSS `group-hover` opacity/visibility. Convert it to state-driven `AnimatePresence`: add `const [open, setOpen] = useState(false);` inside `MegaMenuItem`, put `onMouseEnter={() => setOpen(true)}` / `onMouseLeave={() => setOpen(false)}` on the wrapping `<li>`, and render the panel as:
```tsx
      <AnimatePresence>
        {open ? (
          <motion.div
            className="absolute left-1/2 top-full z-50 -translate-x-1/2"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            {/* existing inner panel markup: the <div className="mt-0 min-w-[520px] ..."> ... */}
          </motion.div>
        ) : null}
      </AnimatePresence>
```
Move the existing panel inner markup (the `<div className="mt-0 min-w-[520px] ...">...</div>`) inside the `motion.div`, and remove the old `invisible ... opacity-0 ... group-hover:visible group-hover:opacity-100` wrapper div.

- [ ] **Step 3: SiteHeader — animate the mobile drawer**

Still in `SiteHeader.tsx`, the mobile drawer currently renders `{drawerOpen && (<div className="fixed inset-0 z-[110] ...">...)}`. Wrap it in `AnimatePresence` and make the backdrop + panel `motion` elements:
```tsx
      <AnimatePresence>
        {drawerOpen ? (
          <div className="fixed inset-0 z-[110] lg:hidden">
            <motion.div
              className="absolute inset-0 bg-black/40"
              onClick={() => setDrawerOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
            <motion.div
              className="absolute left-0 top-0 h-full w-[300px] max-w-[85%] overflow-y-auto bg-white p-5 shadow-xl"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
            >
              {/* existing drawer inner markup (logo row + nav) unchanged */}
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
```
Move the existing drawer inner markup (the close-button row and `<nav>`) into the second `motion.div`, replacing the old static panel `<div>`.

- [ ] **Step 4: HeroCarousel — arrows to MotionButton**

In `apps/user/src/components/home/HeroCarousel.tsx`, add:
```tsx
import { MotionButton } from "@repo/ui/components/motion";
```
Change the two arrow `<button>` elements (prev, `onClick={prev}`; next, `onClick={next}`) to `<MotionButton>` — keep every existing prop (`type`, `onClick`, `aria-label`, `className`) and the icon child unchanged. Leave the dot indicators as plain `<button>` (they already animate width via `transition-all`).

- [ ] **Step 5: Typecheck + lint**

Run:
```bash
npm run typecheck --workspace=packages/ui --workspace=apps/user && npm run lint --workspace=apps/user 2>&1 | grep -cE "error "
```
Expected: typecheck clean; grep prints `0`.

- [ ] **Step 6: Commit**

```bash
git add packages/ui/src/components/SiteHeader.tsx packages/ui/src/components/FloatingWidgets.tsx apps/user/src/components/home/HeroCarousel.tsx
git commit -m "feat(ui): animate mega menu, mobile drawer, floating icons, hero arrows

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Cross-viewport verification (Playwright) + full-repo check

**Files:** none modified (verification only; small fixes if issues surface).

- [ ] **Step 1: Start the user dev server**

Run:
```bash
npm run dev:user > /tmp/anim-verify.log 2>&1 &
```
Then poll until ready:
```bash
for i in $(seq 1 40); do curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null | grep -q "200" && { echo "ready"; break; }; sleep 1; done
```
Expected: `ready`.

- [ ] **Step 2: Desktop (1280×800) — verify section reveal + card hover**

Using Playwright MCP: resize to 1280×800, navigate to `http://localhost:3000/`, scroll to a below-the-fold section, and assert via `browser_evaluate` that a `Reveal`-wrapped section's computed `opacity` is `1` after scrolling into view. Hover a product card and confirm its `<img>` `transform` includes a scale > 1. Screenshot.
Expected: opacity resolves to `1`; image transform shows scale; no console errors.

- [ ] **Step 3: Tablet (768×1024) — verify home + category**

Resize to 768×1024, reload `/`, scroll; navigate to `/categories/be-trai` and confirm the grid cards reach `opacity: 1`. Screenshot.
Expected: reveals fire; no horizontal page overflow (`document.documentElement.scrollWidth <= innerWidth + 1`).

- [ ] **Step 4: Mobile (375×812) — verify drawer + reveal distance**

Resize to 375×812, reload `/`, open the mobile menu (hamburger) and confirm the drawer animates in and its nav is visible. Confirm no horizontal overflow. Screenshot.
Expected: drawer visible after open; no overflow; no console errors.

- [ ] **Step 5: Button press — verify MotionButton**

On `/` (desktop), hover the card "Thêm nhanh vào giỏ +" or navigate to a product page and hover "Thêm vào giỏ hàng"; assert the button's computed `transform` changes on hover (scale). Confirm a `disabled` button (submit "Thanh Toán" while cart empty is not disabled; instead check the QR modal confirm button is enabled) — verify the disabled-suppression by inspecting that `MotionButton` with `disabled` renders `disabled` attribute.
Expected: enabled button scales on hover.

- [ ] **Step 6: Stop server, clean artifacts**

```bash
pkill -f "next dev --port 3000" 2>/dev/null; sleep 1
rm -rf .playwright-mcp
```

- [ ] **Step 7: Full monorepo check**

Run:
```bash
npm run typecheck && npm run lint 2>&1 | grep -cE "error "
```
Expected: typecheck clean across workspaces; grep prints `0`.

- [ ] **Step 8: Commit any verification fixes (if made)**

If Steps 2-5 surfaced fixes, commit them:
```bash
git add -A
git commit -m "fix(user): animation verification fixes

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```
If no fixes were needed, skip this step.
