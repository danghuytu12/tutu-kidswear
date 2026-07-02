# cocandy.vn — Page Topology (assembly blueprint)

Container: full-width white body. Max content width ~1200-1280px centered per section. Sticky header overlays.

## Shared components (used across pages)
- `AnnouncementBar` — cream strip "Freeship cho hóa đơn từ 499K".
- `SiteHeader` — sticky nav (logo, menu w/ mega dropdowns, search, cart). z-100.
- `ProductCard` — the reused product tile (image, hover size overlay, name, prices, discount).
- `SiteFooter` — brand blurb + policy columns + contact + socials.
- `ScrollTopButton` + `ZaloWidget` — floating (decorative).

## Home page (`/`) — top → bottom
1. AnnouncementBar (flow, scrolls away)
2. SiteHeader (sticky)
3. `HeroCarousel` — Swiper, 5 slides, dots + arrows. (scroll: none / time: autoplay)
4. `CategoryQuickLinks` — horizontal row of circular product tiles + names.
5. `ProductTabsSection` — "SẢN PHẨM MỚI" / "SẢN PHẨM BÁN CHẠY" click-tabs → 4×2 product grid. (click-driven)
6. `PromoBanner` #1 (full-width image, links to /categories/...)
7. `ProductCarousel` — "BST đồ bơi" + XEM THÊM
8. `PromoBanner` #2
9. `ProductCarousel` — "BST ÁO THUN" + XEM THÊM
10. `ProductCarousel` — "SALE HÈ THU" + XEM THÊM
11. `PromoBanner` #3
12. `ProductCarousel` — "BST MELLOW CANDY" (Xem thêm top-right) + XEM THÊM
13. `RecentlyViewed` — "CÁC SẢN PHẨM ĐÃ XEM" empty state.
14. SiteFooter

## Product Detail (`/products/[slug]`) — using ao-coc-cotton-van-mong-nau-tay-raclan
1. AnnouncementBar + SiteHeader
2. `Breadcrumb` — "Trang chủ / Website / Bé Trai / Áo / Áo cộc tay / <name>"
3. `ProductDetail` (2-col): left `ProductGallery` (main + thumbs + arrows), right `ProductInfo` (title, prices, -15% badge, size guide link, size chips, qty stepper, add-to-cart + buy-now, zalo CTA, delivery info rows).
4. `ProductDescription` — rich text block (COCANDY blurb, bullets, THÔNG TIN SẢN PHẨM).
5. `ProductCarousel` — "GỢI Ý SẢN PHẨM"
6. `ProductReviews` — "Đánh giá 0.0 (0 bài đánh giá)" empty state.
7. `SimilarProducts` — "Sản phẩm TƯƠNG TỰ" empty state.
8. SiteFooter

## Checkout (`/checkout`) — empty cart state
1. AnnouncementBar + SiteHeader
2. `CheckoutLayout` (2-col):
   - left `OrderForm` — "Thông tin đặt hàng" inputs + "Hình thức thanh toán" radios + "Thanh Toán" button.
   - right `CartSummary` — "Giỏ hàng" empty state + coupon + totals (Tổng tiền 30.000₫).
3. `ProductGrid` — "CÓ THỂ BẠN SẼ THÍCH" 4-col.
4. SiteFooter

## Category (`/categories/[slug]`) — sale-he-thu
1. AnnouncementBar + SiteHeader
2. `Breadcrumb` — "Trang chủ / DM_KHAC / Xả Kho / Sale Hè Thu"
3. `CategoryLayout` (2-col): left `FilterSidebar` (Size radios, Mức giá radios), right: sort dropdown "Sắp xếp / Mới nhất" + 3-col `ProductGrid` (~24 products).
4. SiteFooter

## Route → data
- Home: featured products per carousel (use real cocandy names/prices/images).
- PDP: single product (raclan brown tee) + gallery of 7 images + suggested carousel.
- Category: 24 sale products (real dataset extracted).
- Checkout: empty cart + suggested products.
