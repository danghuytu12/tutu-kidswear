# Shared Components Specification (cocandy.vn)

Built by orchestrator (blocking dependencies for all pages). Colors from getComputedStyle.
Brand tokens available in globals.css: `text-[#b08560]` (brand), `text-[#c2864e]` (price), `#a67b5b` (link), `#dc2525` (sale), `#fffdf4` (cream), `#777` (strike), `#6b818c` (filter label).
Fonts: body = var(--font-body) Be Vietnam Pro (via font-sans). Display = `.font-display` (Baloo 2) for logo/headings/nav.

## ProductCard — `src/components/ProductCard.tsx`
Props: `product: Product` (from @/types), optional `hoverAdd?: boolean` (show size overlay on hover), `sizes?: string[]`.
- Wrapper: `<a href={product.href}>` block. bg transparent.
- Image: 1:1 aspect (`aspect-square`), `rounded-md` (6px), `object-cover`, `w-full`, white bg. Use plain `<img loading="lazy">`.
- Hover overlay (when hoverAdd, default true on home/category carousels): absolutely positioned bar over lower image area, hidden by default, appears on group-hover (opacity + slight translate-y, transition ~0.25s). Content: "Thêm nhanh vào giỏ +" (14px/700 black) centered, plus a wrap of size chips (default sizes ["73","80","90","100","110","120","130","140","150"], 16px, each a small clickable pill). Semi-transparent white bg (`bg-white/90`).
- Name: `mt-2` block, 14px/400 black, 2-line clamp (`line-clamp-2`), leading snug.
- Price row: flex items-baseline gap-1.5 wrap. Sale price 14px/700 `text-[#c2864e]`. Discount 13px/400 `text-[#dc2525]` e.g. "(-15%)". Original 12px/400 `text-[#777]` line-through.
- No border, no card shadow.

## ProductCarousel — `src/components/ProductCarousel.tsx`
Props: `title?: string`, `products: Product[]`, `moreLabel?: string` (default "XEM THÊM"), `moreHref?: string`, `topRightLabel?: string` (e.g. "Xem thêm"), `hoverAdd?: boolean`.
- Section wrapper: `.cocandy-container py-8`.
- Title row: title centered-ish `.font-display` uppercase ~24px/700 black; if topRightLabel present, put it right-aligned link (brand color).
- Track: horizontal scroll `flex gap-4 overflow-x-auto no-scrollbar snap-x` OR a responsive grid. Use horizontal scroll of ProductCards each `min-w` ~ 1/4 desktop (basis: 2 cols mobile, 4 cols desktop). Simpler: CSS scroll-snap horizontal list; each item `w-[calc(50%-8px)] sm:w-[calc(33%-...)] lg:w-[calc(25%-12px)]` shrink-0.
- "XEM THÊM" button: centered below, brown bg `bg-[#b08560]` white text, rounded-full, px-8 py-2, 14px. Links to moreHref.

## ProductGrid — `src/components/ProductGrid.tsx`
Props: `title?: string`, `products: Product[]`, `cols?: 3 | 4` (default 4), `hoverAdd?: boolean`.
- `.cocandy-container py-8`. Optional title `.font-display` uppercase.
- Grid: `grid gap-x-4 gap-y-8 grid-cols-2 md:grid-cols-3 lg:grid-cols-{cols}`. Each cell a ProductCard.

## AnnouncementBar — `src/components/AnnouncementBar.tsx`
- Full-width strip, bg `#fffdf4` (cream), centered text "Freeship cho hóa đơn từ 499K" `.font-display` 20px/700 `text-[#b08560]`, py ~1.5-2 (h≈32-40).

## SiteHeader — `src/components/SiteHeader.tsx` (CLIENT component)
- `sticky top-0 z-[100] bg-white` with subtle bottom border/shadow. h≈87 desktop.
- Layout `.cocandy-container flex items-center gap-6 h-[72px]`:
  - Logo left: `<a href="/">` img `/images/cocandy/logo.png` h≈56 + wordmark handled by image (logo image already has COCANDY text). Use `<img src="/images/cocandy/logo.png" alt="COCANDY" className="h-14 w-auto" />`.
  - Nav center (hidden below lg): items — Trang Chủ, Bé Trai▾, Bé Gái▾, Bộ Sưu Tập▾, Outlet, Cửa hàng, Blog. Links `.font-display` 17px/700 `text-[#b08560] hover:text-[#8a6647]`. Dropdown items (Bé Trai/Bé Gái/Bộ Sưu Tập) show a mega-menu on hover: white panel, shadow, grouped columns — group title `.font-display` 18-20px/700 black, links 16-18px/400 black hover brand. Use data from `@/lib/navigation` (megaMenus, simpleNavLinks). Order: Trang Chủ, Bé Trai, Bé Gái, Bộ Sưu Tập, Outlet, Cửa hàng, Blog.
  - Right: search pill (rounded-full grey bg `#f2f2f2`, SearchIcon + placeholder "Tìm kiếm sản phẩm..." input, ~w-72, hidden on small) + CartIcon (with count badge "0" yellow circle top-right).
  - Mobile (<lg): MenuIcon (hamburger) left toggles an off-canvas drawer (fixed, slide-in from left, lists all nav + mega groups expanded), centered logo, search icon + cart icon right.
- Import icons from `@/components/icons`.

## SiteFooter — `src/components/SiteFooter.tsx`
- Two parts: (1) thin decorative strip (light bg, small height ~40, can be cream or a subtle brand tint — keep simple), (2) main footer.
- Main footer bg cream/white, `.cocandy-container py-10 grid gap-8 md:grid-cols-4`:
  - Col 1 (brand): logo img h-12, `footerContact.blurbTitle` `.font-display` 18px/700, `footerContact.blurb` 14px grey, social icons row (Facebook, Instagram, Youtube, Tiktok from icons — circular brand-colored).
  - Col 2: "CHÍNH SÁCH" title `.font-display` 16px/700 + links (footerColumns[0].links) 14px grey, hover brand.
  - Col 3: "CHĂM SÓC KHÁCH HÀNG" title + footerColumns[1].links.
  - Col 4: "HỆ KINH DOANH..." businessName 14px/700 + office + PhoneIcon hotline + MailIcon email + legal small grey.
  - Data from `@/lib/navigation` (footerColumns, footerContact).

## ScrollTopButton + ZaloWidget — `src/components/FloatingWidgets.tsx` (CLIENT)
- ZaloWidget: fixed bottom-right, ZaloIcon (from icons) ~56px circle.
- ScrollTopButton: fixed bottom-left, brown circle `bg-[#b08560]`, ChevronUpIcon white, appears after scrollY>400, smooth-scrolls to top.
