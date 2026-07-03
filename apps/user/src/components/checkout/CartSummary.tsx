"use client";

import { useCart } from "@repo/ui/components/cart/CartContext";
import { formatVnd } from "@repo/ui/lib/cart";

const SHIPPING_FEE = 30000;

export function CartSummary() {
  const { items, totalPrice } = useCart();
  const isEmpty = items.length === 0;
  const grand = isEmpty ? 0 : totalPrice + SHIPPING_FEE;

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

      {isEmpty ? (
        <div className="py-10 text-center">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#f3f3f3]">
            <span className="text-4xl" aria-hidden>
              🏷️
            </span>
          </div>
          <p className="mt-3 text-[15px] text-[#999]">Chưa có sản phẩm nào</p>
        </div>
      ) : (
        <ul className="divide-y">
          {items.map((it) => (
            <li key={it.href} className="flex items-center gap-3 py-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={it.img}
                alt={it.name}
                className="h-14 w-14 shrink-0 rounded-md object-cover"
              />
              <span className="flex-1 text-[14px] text-black">{it.name}</span>
              <span className="w-10 text-center text-[14px] text-black">
                x{it.qty}
              </span>
              <span className="w-24 text-right text-[14px] font-semibold text-[#c2864e]">
                {formatVnd(it.price * it.qty)}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex gap-2">
        <input
          placeholder="Nhập mã giảm giá"
          className="flex-1 rounded-full border border-black/15 px-4 py-2.5 text-[14px] outline-none focus:border-[#b08560] placeholder:text-black/40"
        />
        <button type="button" className="rounded bg-[#e3e3e3] px-5 text-black">
          Áp dụng
        </button>
      </div>

      <div className="mt-6 space-y-2 text-[15px]">
        <div className="flex justify-between">
          <span>Tạm tính</span>
          <span>{formatVnd(isEmpty ? 0 : totalPrice)}</span>
        </div>
        <div className="flex justify-between">
          <span>Giảm giá</span>
          <span>0 ₫</span>
        </div>
        <div className="flex justify-between">
          <span>Giá giao hàng</span>
          <span>{formatVnd(isEmpty ? 0 : SHIPPING_FEE)}</span>
        </div>
        <div className="flex justify-between border-t pt-3">
          <span className="font-bold">Tổng tiền</span>
          <span className="text-[18px] font-bold">{formatVnd(grand)}</span>
        </div>
      </div>
    </div>
  );
}
