# Checkout Page Spec (`/checkout`) — cocandy.vn

Screenshot: docs/design-references/cocandy-checkout-desktop-full.png
Route file: `src/app/checkout/page.tsx`. Sections in `src/components/checkout/`.
Shared (import): AnnouncementBar, SiteHeader, SiteFooter, FloatingWidgets, ProductGrid.
Data: `@/lib/products` → suggestedProducts (4 items).

## Page order:
1. AnnouncementBar, SiteHeader
2. `<CheckoutLayout />` (2-col)
3. `<ProductGrid title="CÓ THỂ BẠN SẼ THÍCH" products={suggestedProducts} cols={4} />`
4. SiteFooter, FloatingWidgets

## CheckoutLayout — `src/components/checkout/CheckoutLayout.tsx` (CLIENT)
`.cocandy-container grid gap-10 py-8 lg:grid-cols-[1.4fr_1fr]`.

### Left column: OrderForm
- H2 "Thông tin đặt hàng" `.font-display` 26px/700 black mb-6.
- Fields (rounded-full pill inputs, border border-black/15, px-5 py-3, text-[15px], placeholder grey, full-width, focus ring brand):
  - Label "Họ và tên *" + input placeholder "Họ và tên"  (labels 14px black, mb-1)
  - Label "Số điện thoại *" + input placeholder "Số điện thoại"  (these two in a 2-col grid on desktop)
  - Label "Email" + input placeholder "Email"
  - Label "Địa chỉ *" + input placeholder "Địa chỉ ( VD: 532 Nguyễn Văn Cừ )"
  - 3 selects in a row (2-col/3-col): "Tỉnh/Thành phố", "Quận/Huyện", "Phường/Xã" — styled select with ChevronDownIcon; use native <select> with a single placeholder option each, rounded-full border.
  - Textarea placeholder "Ghi chú thêm ( Ví dụ: Giao hàng giờ hành chính)" rounded-2xl border, rows=3.
- H2 "Hình thức thanh toán" `.font-display` 26px/700 mt-8 mb-4.
- Two radio option boxes (bordered rounded-lg px-4 py-3, flex items-center gap-3):
  - [selected] radio + DeliveryIcon + "Thanh toán khi nhận hàng" — selected box border-[#2f5acf]/blue border-2, radio filled blue.
  - radio + a QR glyph (use a simple bordered square or ScanLine—if unavailable use text) + "Chuyển khoản ngân hàng bằng QR Code".
  - Use useState for selected payment (default "cod").
- Button "Thanh Toán" full-width bg-[#b08560] text-white rounded-full py-3.5 text-[16px] font-semibold mt-5 hover:bg-[#8a6647].

### Right column: CartSummary
- H2 "Giỏ hàng" `.font-display` 26px/700 mb-4.
- Header row (uppercase 12px grey, flex justify-between): "TẤT CẢ SẢN PHẨM" / "SỐ LƯỢNG" / "GIÁ". border-b pb-2.
- Empty state: centered illustration placeholder (a light grey rounded box or a simple tag SVG — you can render a muted circle with a "🏷️" or an inline svg), + "Chưa có sản phẩm nào" text-[15px] text-[#999] centered, py-10.
- Coupon row: input placeholder "Nhập mã giảm giá" (rounded-full border, flex-1) + button "Áp dụng" bg-[#e3e3e3] rounded px-5 text-black.
- Summary rows (mt-6, space-y-2, flex justify-between text-[15px]):
  - "Tạm tính" ... "0 ₫"
  - "Giảm giá" ... "0 ₫"
  - "Giá giao hàng" ... "30.000 ₫"
  - border-t pt-3: "Tổng tiền" (bold) ... "30.000 ₫" (bold 18px black)

## Responsive: desktop 2-col; mobile single column, form above summary. Inputs full-width.

Verify `npx tsc --noEmit`. Plain `<img>`. Do NOT edit shared components or other pages.
