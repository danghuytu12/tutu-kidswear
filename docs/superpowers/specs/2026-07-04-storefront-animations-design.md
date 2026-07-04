# Storefront Animations — Design

**Date:** 2026-07-04
**Scope:** Add subtle, professional motion to the entire `apps/user` storefront — every screen, section, and interactive icon — responsive across desktop, tablet, and mobile.

## Goals

- Sections fade + slide up gently as they scroll into view.
- Product grids reveal their cards in a staggered sequence; cards lift and their image zooms slightly on hover.
- Interactive icons/buttons (floating Zalo/Instagram/Messenger, add-to-cart, cart icon) have smooth hover/tap motion.
- Header interactions (mega menu, mobile drawer) animate in/out smoothly.
- Motion amplitude scales down on smaller screens so it feels right on phones.

## Decisions (locked)

- **Library:** `framer-motion`. Installed in `packages/ui` (shared primitives live there); apps consume via `transpilePackages: ["@repo/ui"]`.
- **Style:** subtle / professional — not playful/bouncy, not minimal. Fades, short slides, small hover lifts.
- **Reduced motion:** NOT honored — animations always run (explicit user choice).
- **Server Components stay server-rendered.** Only presentational wrappers are client components; data fetching in PDP/category pages is untouched.
- **Performance:** animate only `opacity` and `transform` (GPU-composited, no layout shift).

## Architecture — 3 reusable primitives

Location: `packages/ui/src/components/motion/`

### 1. `Reveal`
Wraps a section. Fades + slides up when scrolled into view.
- Props: `children`, `delay?: number` (default 0), `className?`, `as?` (element, default `div`).
- Motion: `initial={{ opacity: 0, y: distance }}`, `whileInView={{ opacity: 1, y: 0 }}`, `viewport={{ once: true, margin: "-80px" }}`, `transition={{ duration: 0.5, ease: "easeOut", delay }}`.
- Responsive distance: a shared `useMotionDistance()` hook (in `motion/useMotionDistance.ts`) returns `16` when viewport width < 768px, else `24`. `Reveal` calls it internally so callers never pass `y`. The hook reads `window.matchMedia("(max-width: 767px)")` and updates on resize.

### 2. `StaggerGrid` + `StaggerItem`
Reveals children one-by-one.
- `StaggerGrid`: container with `variants` using `staggerChildren: 0.06`.
- `StaggerItem`: `variants` `{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } } }`.
- `StaggerGrid` uses `initial="hidden"`, `whileInView="show"`, `viewport={{ once: true, margin: "-60px" }}`.

### 3. `HoverLift`
Wraps an icon/button/card for hover + tap motion.
- Props: `children`, `className?`, `lift?: number` (default 4).
- Motion: `whileHover={{ y: -lift, scale: 1.03 }}`, `whileTap={{ scale: 0.97 }}`, `transition={{ type: "spring", stiffness: 300, damping: 20 }}`.

All three are `"use client"`, minimal, and export from `@repo/ui/components/motion`.

## Application map

| Area | Component(s) | Animation |
|---|---|---|
| Home hero | `home/HeroCarousel` | crossfade between slides; wrap in `Reveal` |
| Home sections | `home/ProductTabsSection`, `PromoBanner`, `CategoryQuickLinks`, `RecentlyViewed` | each wrapped in `Reveal` with increasing `delay` |
| PDP | `pdp/ProductDetail`, `ProductDescription`, similar carousel | `Reveal` per block; gallery image crossfade on change |
| Category | `category/CategoryLayout` | grid via `StaggerGrid` |
| Checkout | `checkout/CheckoutLayout`, `OrderForm`, `CartSummary` | `Reveal` per block |
| Shared grid/carousel | `ProductGrid`, `ProductCarousel` | `StaggerGrid` for cards |
| Product card | `ProductCard` | hover lift + image zoom (keep existing group-hover, smooth it) |
| Floating widgets | `FloatingWidgets` | `HoverLift` on each icon |
| Header | `SiteHeader` | mega menu: `AnimatePresence` fade+slide 8px; mobile drawer: slide-in + backdrop fade |

## Responsive behavior

- Section slide distance from `useMotionDistance()`: 24px ≥768px, 16px <768px.
- Card slide 16px (all sizes); stagger 0.06s (all sizes).
- `whileInView` triggers correctly on all touch devices.
- Verification runs at 1280 (desktop), 768 (tablet), 375 (mobile).

## Testing / verification

Playwright at 3 viewports:
1. Scroll the homepage → assert a below-the-fold section transitions from low opacity to `opacity: 1`.
2. Product grid cards reveal in sequence (opacity resolves to 1).
3. Hover a product card → image scales up, card lifts.
4. Open mega menu + mobile drawer → they animate and become visible.
5. No console errors; no horizontal page overflow (layout-shift check).
6. `npm run typecheck` + `npm run lint` clean.
7. Screenshots captured per viewport.

## Non-goals

- No route-transition/page-load animations beyond section reveals.
- No parallax, scroll-scrubbed, or bounce/elastic effects.
- No changes to business logic, data fetching, or the admin app.
