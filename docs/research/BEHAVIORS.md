# cocandy.vn — Behavior Bible

Platform: Pancake/Webcake storefront (`.x-section` blocks, `.x-wrapper`). Uses Swiper for carousels. No Lenis/smooth-scroll lib — native scroll.

## Global
- **Body font:** `"font moi", sans-serif` (custom), fallbacks Pangea / Roboto / Open Sans. Base 14px, black text on white.
- **Sticky header:** the main nav section (`#SECTION-oty7p49t`) is `position: sticky; z-index: 100`. It stays pinned on scroll. The thin announcement bar above it scrolls away; nav pins to top.
- **Scroll-to-top FAB:** brown circular button bottom-left with up-chevron, appears after scrolling.
- **Zalo chat widget:** floating blue circle bottom-right (decorative in clone).
- No scroll-driven section switching, no parallax, no entrance animations of note. Static flow content + carousels.

## Brand Colors (from computed styles)
- Brand brown (primary): `rgb(176,133,96)` #B08560 — announcement text, nav links, buttons
- Brown accent (price): `rgb(194,134,78)` #C2864E — product sale price
- Brown link: `rgb(166,123,91)` #A67B5B — secondary links
- Sale red: `rgb(220,37,37)` #DC2525 — discount %, badges
- Red alt: `rgb(228,54,54)` #E43636
- Orange: `rgb(253,90,0)` #FD5A00 — accents
- Cream bg: `rgb(255,253,244)` #FFFDF4 — announcement bar bg
- Grey strikethrough price: `rgb(119,119,119)` #777
- Grey muted (orig price on PDP): `rgb(196,196,196)` #C4C4C4
- Filter label grey-blue: `rgb(107,129,140)` #6B818C
- Button light grey (PDP): `rgb(227,227,227)` #E3E3E3

## Header / Nav
- Top row: "Freeship cho hóa đơn từ 499K" (centered, 20px/700 brown #B08560, cream bg).
- Main bar (sticky, white bg, h≈87): Logo (left) | nav links (Trang Chủ, Bé Trai▾, Bé Gái▾, Bộ Sưu Tập▾, Outlet, Cửa hàng, Blog) 17px/700 brown | search pill | cart icon w/ count badge.
- **Mega-menu dropdowns** (Bé Trai / Bé Gái / Bộ Sưu Tập): hover-opens a panel with grouped columns — H3 group title 20px/700 black, links 18px/400 black. Bé Trai groups: Áo / Quần / Đồ Bộ / Phụ Kiện. Bé Gái groups: Đầm váy / Áo / Quần / Đồ bộ / Phụ kiện. Bộ Sưu Tập: BST Noel, BST Gia Đình, BST Dự Tiệc, Trang Phục Truyền Thống, BST Đồ Bơi, BST Đi Học.
- **Mobile (<=768):** collapses to hamburger + centered logo + search icon + cart icon. Nav becomes off-canvas drawer.

## Product Card (MOST REUSED — used on home, PDP suggestions, checkout suggestions, category)
- Image: 1:1 aspect, `border-radius: 6px`, `object-fit: cover`, white bg.
- **Hover overlay** (home/category carousels): "Thêm nhanh vào giỏ +" (14px/700 black) bar with size chips (73/80/90/100/110/120/130/140/150 — 16px) appears over the lower part of the image on hover. Clicking a size quick-adds to cart. INTERACTION: hover reveals overlay (opacity/translate). In clone: show on hover via CSS.
- Name: 14px/400 black, 1-2 lines.
- Sale price: 14px/700 brown #C2864E.
- Discount: 13px/400 red #DC2525, format `(-15%)`.
- Original price: 12px/400 grey #777, `line-through`.
- Card width ~297px in 4-col desktop grid; 2-col on mobile.

## Homepage behaviors
- **Hero:** Swiper carousel, 5 slides (2000x1000), auto-advancing, with pagination dots + prev/next arrows.
- **New/Bestseller tabs** (`SECTION-8ma8tfug`): TWO tab headers side by side — "SẢN PHẨM MỚI" | "SẢN PHẨM BÁN CHẠY". INTERACTION MODEL: **click-driven tabs** — clicking switches the product grid below. Active tab has emphasis. Grid = 4 cols × 2 rows (8 products).
- **Category quick-links** (`SECTION-pyyxw657`): row of ~8-9 circular product-image tiles, horizontally scrollable, each links to a product; name below each. Small red count badges "0/4/2/8/6/5" observed (likely decorative numbering).
- **Product carousels** (BST đồ bơi, BST ÁO THUN, SALE HÈ THU, BST MELLOW CANDY): section title + horizontal Swiper of product cards + "XEM THÊM" button (brown, white text). BST MELLOW CANDY has "Xem thêm" link top-right.
- **Mid banners** (3×): full-width clickable banner images (2000x1000).
- **Recently viewed** (`SECTION-sn5hzd0u`): "CÁC SẢN PHẨM ĐÃ XEM" — empty state "Chưa có sản phẩm nào" + apology text. In clone: render empty-state.

## Product Detail (PDP) behaviors
- Breadcrumb bar.
- **Gallery:** main image (1:1) with prev/next arrows overlaid + thumbnail strip below (6 thumbs). Clicking thumb / arrow changes main image. INTERACTION: click-driven gallery (Swiper thumbs).
- Title 25px/700. Orig price 169.000₫ 14px struck grey #C4C4C4. Sale price 144.000₫ 22px black. **Red -15% badge** (white text, ~15px, rounded).
- "Hướng dẫn chọn size" link (brown, right-aligned).
- **Size selector:** pill chips (100/110/120/130/140/150). Active = black filled white text; inactive = white bg, grey border. Above chips a small "size" label + selected value.
- **Qty stepper:** (− 1 +) pill.
- **Buttons:** "Thêm vào giỏ hàng" + "Mua ngay" side by side, bg #E3E3E3, radius 4px, black text 16px.
- Zalo CTA line + 4 delivery-info rows w/ icons (Đổi cực dễ…, Đổi trong vòng 15 ngày, Hotline…, Giao hàng toàn quốc).
- **Description block:** long rich text — "Thời Trang COCANDY / Comfy, Sweet and Happy!" + bullet points + ❤️THÔNG TIN SẢN PHẨM.
- **GỢI Ý SẢN PHẨM:** suggested products carousel.
- **Đánh giá:** reviews summary "0.0 (0 bài đánh giá)" + empty state.
- **Sản phẩm TƯƠNG TỰ:** similar products (empty).

## Checkout behaviors
- Cart empty by default → 2-column layout.
- **Left** "Thông tin đặt hàng": inputs Họ và tên*, Số điện thoại*, Email, Địa chỉ*, 3 selects (Tỉnh/Thành phố, Quận/Huyện, Phường/Xã), Ghi chú thêm textarea. Rounded pill inputs, grey border. "Hình thức thanh toán": 2 radio rows (Thanh toán khi nhận hàng [selected], Chuyển khoản ngân hàng bằng QR Code) in bordered boxes; selected has blue border. Full-width brown "Thanh Toán" button (radius pill).
- **Right** "Giỏ hàng": header row (TẤT CẢ SẢN PHẨM / SỐ LƯỢNG / GIÁ), empty-cart illustration + "Chưa có sản phẩm nào", coupon input "Nhập mã giảm giá" + "Áp dụng" grey button, summary rows Tạm tính 0₫ / Giảm giá 0₫ / Giá giao hàng 30.000₫ / **Tổng tiền 30.000₫** (bold).
- Below both columns: **CÓ THỂ BẠN SẼ THÍCH** — 4-col product grid (larger cards, discount inline).

## Category behaviors
- Breadcrumb "Trang chủ / DM_KHAC / Xả Kho / Sale Hè Thu".
- 2-column: **left sidebar filters** — H5 "Size" (label grey-blue #6B818C) radio list (66 (5-8kg), 73 (8-10kg), 80, 90, 100, 110, 120, 130, 140, 150 with weight ranges), H5 "Mức giá" radios (Giá dưới 100.000đ, 100.000đ-200.000đ, 200.000đ-300.000đ, Giá trên 300.000đ). Some categories also show a "Danh mục" list.
- **Right:** "Sắp xếp" label + "Mới nhất" sort dropdown (top-right), then **3-column product grid** (larger cards). ~24 products.
- Footer.

## Footer (shared, all pages)
- Thin decorative strip section (`SECTION-dzb3rvd7`, h=149).
- Main footer (`SECTION-jk60k17h`): columns — brand blurb "COCANDY lắng nghe bạn!" + social icons + newsletter, "CHÍNH SÁCH", "CHĂM SÓC KHÁCH HÀNG", "HỆ KINH DOANH..." with address + hotline + email. On cream/light bg.

## Responsive breakpoints
- Desktop 1440: full nav, 4-col product grids (home carousels), 3-col category, 2-col checkout/PDP.
- Tablet 768: nav → hamburger begins; grids reduce cols.
- Mobile 390: hamburger nav, 2-col product grid, single-column checkout & PDP (gallery stacks above info).
