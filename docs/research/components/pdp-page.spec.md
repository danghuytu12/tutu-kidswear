# Product Detail Page Spec (`/products/[slug]`) — cocandy.vn

Screenshot: docs/design-references/cocandy-product-desktop-top.png
Route file: `src/app/products/[slug]/page.tsx` (use params but render the single known product regardless of slug — it's a demo clone). Sections in `src/components/pdp/`.
Shared (import): AnnouncementBar, SiteHeader, SiteFooter, FloatingWidgets, ProductCarousel.
Data (import): `@/lib/products` → pdpProduct, teeProducts (for GỢI Ý SẢN PHẨM). `pdpProduct` has: name, sku, sale, orig, discPct ("15%"), sizes: string[], gallery: string[] (7 local paths), breadcrumb: string[].

## Page order:
1. AnnouncementBar, SiteHeader
2. `<Breadcrumb items={pdpProduct.breadcrumb} />`
3. `<ProductDetail />` (2-col main)
4. `<ProductDescription />`
5. `<ProductCarousel title="GỢI Ý SẢN PHẨM" products={teeProducts} moreLabel="" />`  (no XEM THÊM button → pass moreLabel="")
6. `<ProductReviews />`
7. `<SimilarProducts />`
8. SiteFooter, FloatingWidgets

## Breadcrumb — `src/components/pdp/Breadcrumb.tsx`
Props: `items: string[]`. `.cocandy-container py-4`. Render items joined with " / " — each 14px text-black/70, last one plain, separators grey. Links "#".

## ProductDetail — `src/components/pdp/ProductDetail.tsx` (CLIENT)
`.cocandy-container grid gap-8 lg:grid-cols-2 pb-8`.
### Left: ProductGallery (inline or subcomponent)
- Main image: `pdpProduct.gallery[active]`, `aspect-square w-full rounded-lg object-cover`. Prev/next chevron buttons overlaid (ChevronLeftIcon/Right from @/components/icons), semi-transparent.
- Thumbnail strip below: horizontal row of the 7 gallery thumbs, each `h-16 w-16 rounded object-cover cursor-pointer`, active has brand ring `ring-2 ring-[#b08560]`. Click sets active.
### Right: ProductInfo
- Title `pdpProduct.name` — `.font-display`? No, keep body font. 25px/700 black.
- Orig price `pdpProduct.orig` 14px line-through grey `#c4c4c4`.
- Row: sale price `pdpProduct.sale` 22px/700 black + red badge: `-{discPct}` white text on `#dc2525`, rounded, px-2 py-0.5 text-[13px] (e.g. "-15%"). Show pdpProduct.discPct which is "15%" → render "-15%".
- "Hướng dẫn chọn size" link right-aligned brand `#a67b5b` underline, 14px.
- Size selector: label "size" 12px grey + selected value; row of pills from pdpProduct.sizes. Active = black bg white text; inactive = white bg border border-black/20 text-black. rounded-full px-4 py-1.5 text-[15px]. useState for selected (default first).
- Qty stepper: rounded-full border, [− | value | +] with MinusIcon/PlusIcon, useState qty (min 1).
- Buttons row: "Thêm vào giỏ hàng" + "Mua ngay" — bg `#e3e3e3` text-black rounded text-[16px] px-6 py-3, hover darken. Full-width split.
- Zalo CTA line: small text "Nhấn nút zalo để được tư vấn ngay (8:30 - 23:00) →" brand color 14px.
- Delivery info: 4 rows with icons (ExchangeIcon, ReturnIcon, PhoneIcon, DeliveryIcon from @/components/icons) + text: "Đổi cực dễ chỉ cần số điện thoại", "Đổi trong vòng 15 ngày", "Hotline 0903241926 hỗ trợ từ 8h30 - 23h mỗi ngày", "Giao hàng toàn quốc". 14px, 2-col grid on desktop.

## ProductDescription — `src/components/pdp/ProductDescription.tsx`
`.cocandy-container py-8`. Rich text block, 16px/400 black, leading-relaxed, space-y-3:
- "Thời Trang COCANDY"
- "Comfy, Sweet and Happy!"
- "Tại sao bạn nên quyết định chọn đồ cho bé của COCANDY:"
- "- Sản phẩm được thiết kế và sản xuất tại Việt Nam bởi công ty TNHH thời trang COCANDY"
- "- Chất liệu sản phẩm được chọn lọc kỹ càng đảm bảo an toàn cho làn da em bé"
- "- Kiểu dáng, quy cách được lên bởi đội ngũ thiết kế có kinh nghiệm phù hợp với khí hậu Việt Nam"
- "- Mẫu mã đa dạng, tính ứng dụng cao: mẹ có thể sử dụng cho bé đi dã ngoại, đi học, đi chơi..."
- "❤️THÔNG TIN SẢN PHẨM" (bold)
- "Thương hiệu: COCANDY"
- "Xuất xứ: Việt Nam"
- "Mã sản phẩm: E2051"
- "Chất liệu: Áo cộc cotton vân mỏng NÂU tay raclan E2051 chất cotton vân mỏng, kết cấu thoáng mát thấm hút mồ hôi tốt phù hợp mùa hè."
- "LƯU Ý: Sản phẩm chỉ gồm lẻ Áo cộc cotton vân mỏng NÂU tay raclan E2051 chưa bao gồm phụ kiện đi kèm."

## ProductReviews — `src/components/pdp/ProductReviews.tsx`
`.cocandy-container py-8 border-t`. Title "Đánh giá" 20px/700. Row: big "0.0" + 5 empty StarIcons + "(0 bài đánh giá)". Sub: "Hãy chia sẻ suy nghĩ của bạn." + a disabled-looking review box placeholder.

## SimilarProducts — `src/components/pdp/SimilarProducts.tsx`
`.cocandy-container py-8`. Title "Sản phẩm TƯƠNG TỰ" `.font-display` uppercase 20px. Empty state: "Chưa có sản phẩm nào" + "Chúng tôi rất xin lỗi vì sự bất tiện này. Hãy tìm kiếm sản phẩm khác nhé!" grey, centered py-10.

## Responsive: desktop 2-col (gallery|info); mobile single col (gallery stacks above info), buttons full-width stack.

Verify `npx tsc --noEmit`. Plain `<img>`. Do NOT edit shared components or other pages. Note ProductCarousel needs moreLabel="" to hide button — confirm that prop hides it (it renders button only if moreLabel truthy).
