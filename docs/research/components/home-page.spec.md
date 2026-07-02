# Home Page Spec (`/`) — cocandy.vn

Screenshots: docs/design-references/cocandy-home-desktop-full.png, cocandy-home-mobile-full.png
Route file: `src/app/page.tsx`. Section components in `src/components/home/`.
Shared (already built, import these): AnnouncementBar, SiteHeader, SiteFooter, FloatingWidgets, ProductCarousel, ProductGrid, ProductCard.
Data (import): `@/lib/products` → newProducts, bestsellerProducts, swimProducts, teeProducts, mellowProducts. `@/lib/navigation` → quickCategoryTiles.

## Page order (top→bottom), all inside `<>`:
1. `<AnnouncementBar />`
2. `<SiteHeader />`
3. `<HeroCarousel />`
4. `<CategoryQuickLinks />`
5. `<ProductTabsSection />`
6. `<PromoBanner src="/images/cocandy/banner-1.png" href="/categories/bst-do-boi" />`
7. `<ProductCarousel title="BST đồ bơi" products={swimProducts} moreHref="/categories/bst-do-boi" />`
8. `<PromoBanner src="/images/cocandy/banner-2.png" href="/categories/bst" />`
9. `<ProductCarousel title="BST ÁO THUN" products={teeProducts} moreHref="/categories/ao" />`
10. `<ProductCarousel title="SALE HÈ THU" products={saleHeThuProducts.slice(0,8)} moreHref="/categories/sale-he-thu" />`  (import saleHeThuProducts too)
11. `<PromoBanner src="/images/cocandy/banner-3.png" href="/categories/bst-mellow-candy" />`
12. `<ProductCarousel title="BST MELLOW CANDY" products={mellowProducts} topRightLabel="Xem thêm" topRightHref="/categories/bst-mellow-candy" moreHref="/categories/bst-mellow-candy" />`
13. `<RecentlyViewed />`
14. `<SiteFooter />`
15. `<FloatingWidgets />`

## HeroCarousel — `src/components/home/HeroCarousel.tsx` (CLIENT)
INTERACTION: time-driven autoplay carousel + prev/next arrows + dots. Slides = ["/images/cocandy/hero-1.png" ... hero-5.png].
- Full-width. Slides 2:1 aspect (2000x1000). Container max-w none but content centered; images `w-full object-cover aspect-[2/1] max-h-[560px]`.
- Implement with state index + setInterval(5000) auto-advance. Prev/next chevron buttons (ChevronLeftIcon/ChevronRightIcon from @/components/icons) overlaid left/right, semi-transparent circles. Pagination dots centered bottom; active dot brand color, others white/50.
- Crossfade or slide transition (translateX track). Rounded none. Wrap each slide `<a href="#">`.

## CategoryQuickLinks — `src/components/home/CategoryQuickLinks.tsx`
- `.cocandy-container py-6`. Horizontal scroll row (`no-scrollbar flex gap-4 overflow-x-auto`) of circular tiles from `quickCategoryTiles`.
- Each tile: `<a>` shrink-0 w-28, image `h-24 w-24 rounded-full object-cover mx-auto ring-1 ring-black/5`, name below `mt-2 text-center text-[12px] line-clamp-2 text-black`.

## ProductTabsSection — `src/components/home/ProductTabsSection.tsx` (CLIENT)
INTERACTION MODEL: **click-driven tabs**. Two tabs: "SẢN PHẨM MỚI" (newProducts) | "SẢN PHẨM BÁN CHẠY" (bestsellerProducts).
- `.cocandy-container py-8`. Tab header row: two buttons side by side, `.font-display` 20-22px/700 uppercase. Active tab: black text + brand underline/border-bottom 3px `#b08560`; inactive: grey `#999`. Center the two tabs with a divider.
- Below: a 4-col grid (2 col mobile) of the active tab's 8 products via ProductCard. Switch content on click with a short opacity transition.

## PromoBanner — `src/components/home/PromoBanner.tsx`
Props: `src: string`, `href: string`, `alt?: string`.
- `.cocandy-container py-4`. `<a href={href}>` block, img `w-full rounded-lg object-cover` (2:1). Plain `<img loading="lazy">`.

## RecentlyViewed — `src/components/home/RecentlyViewed.tsx`
- `.cocandy-container py-8`. Title `.font-display` uppercase 20px "CÁC SẢN PHẨM ĐÃ XEM".
- Empty state centered: muted text "Chưa có sản phẩm nào" (18px), sub "Chúng tôi rất xin lỗi vì sự bất tiện này. Hãy tìm kiếm sản phẩm khác nhé!" (14px grey). py-12.

## Responsive
- Desktop 1440: hero max-h ~560, product tab grid 4-col, carousels show 4.
- Mobile 390: hero full-width shorter, grids 2-col, quick-links scroll.

Verify `npx tsc --noEmit` passes. Use plain `<img>` (eslint-disable-next-line @next/next/no-img-element where needed). Do NOT edit shared components or other pages.
