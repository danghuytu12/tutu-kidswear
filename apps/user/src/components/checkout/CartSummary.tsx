export function CartSummary() {
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

      <div className="py-10 text-center">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#f3f3f3]">
          <span className="text-4xl" aria-hidden>
            🏷️
          </span>
        </div>
        <p className="mt-3 text-[15px] text-[#999]">Chưa có sản phẩm nào</p>
      </div>

      <div className="mt-4 flex gap-2">
        <input
          placeholder="Nhập mã giảm giá"
          className="flex-1 rounded-full border border-black/15 px-4 py-2.5 text-[14px] outline-none focus:border-[#b08560] placeholder:text-black/40"
        />
        <button
          type="button"
          className="rounded bg-[#e3e3e3] px-5 text-black"
        >
          Áp dụng
        </button>
      </div>

      <div className="mt-6 space-y-2 text-[15px]">
        <div className="flex justify-between">
          <span>Tạm tính</span>
          <span>0 ₫</span>
        </div>
        <div className="flex justify-between">
          <span>Giảm giá</span>
          <span>0 ₫</span>
        </div>
        <div className="flex justify-between">
          <span>Giá giao hàng</span>
          <span>30.000 ₫</span>
        </div>
        <div className="flex justify-between border-t pt-3">
          <span className="font-bold">Tổng tiền</span>
          <span className="text-[18px] font-bold">30.000 ₫</span>
        </div>
      </div>
    </div>
  );
}
