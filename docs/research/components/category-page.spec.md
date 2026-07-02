# Category Page Spec (`/categories/[slug]`) — cocandy.vn (sale-he-thu)

Screenshot: docs/design-references/cocandy-category-desktop-top.png
Route file: `src/app/categories/[slug]/page.tsx` (render demo content regardless of slug). Sections in `src/components/category/`.
Shared (import): AnnouncementBar, SiteHeader, SiteFooter, FloatingWidgets, ProductCard.
Data: `@/lib/products` → saleHeThuProducts (24 items). `@/lib/navigation` → sizeOptions, priceFilterOptions.

## Page order:
1. AnnouncementBar, SiteHeader
2. `<Breadcrumb />` — "Trang chủ / DM_KHAC / Xả Kho / Sale Hè Thu" (`.cocandy-container py-4`, 14px, items joined " / ", links "#", last plain).
3. `<CategoryLayout />` (2-col)
4. SiteFooter, FloatingWidgets

## CategoryLayout — `src/components/category/CategoryLayout.tsx` (CLIENT)
`.cocandy-container grid gap-8 py-6 lg:grid-cols-[240px_1fr]`.

### Left: FilterSidebar
- Block "Size": H5 "Size" `.font-display`? no — 15px/700 text-[#6b818c] mb-2. Radio list from `sizeOptions`: each row = radio circle + "{label} ( {weight} )" e.g. "66 ( 5 - 8 kg )", 15px black, py-1, cursor-pointer. useState selectedSize.
- Block "Mức giá" (mt-6): H5 "Mức giá" 15px/700 text-[#6b818c] mb-2. Radios from `priceFilterOptions` (e.g. "Giá dưới 100.000đ"). useState selectedPrice.
- Radios styled as small circles (border, filled brand when active).

### Right: product area
- Top bar: right-aligned "Sắp xếp" label 14px + a sort dropdown "Mới nhất" (native <select> rounded-full border px-4 py-2, options: Mới nhất, Giá tăng dần, Giá giảm dần, Bán chạy). flex justify-end items-center gap-3 mb-6.
- Grid: `grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3` of ProductCard for all 24 saleHeThuProducts. Use `hoverAdd={false}` here (category cards on the live site don't show the size overlay — just image/name/price/discount). Cards are larger (3-col).

## Responsive:
- Desktop 1440: sidebar 240px + 3-col grid.
- Tablet 768: sidebar may collapse; keep 2-3 col grid. Acceptable: sidebar stacks above grid on mobile, grid 2-col.
- Mobile 390: single column — filters collapse to top (can stay visible stacked), product grid 2-col.

Verify `npx tsc --noEmit`. Plain `<img>` (ProductCard handles images). Do NOT edit shared components or other pages.
