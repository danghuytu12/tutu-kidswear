"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@repo/ui/components/cart/CartContext";
import { cartLineKey, formatVnd, shippingFee } from "@repo/ui/lib/cart";

export function CartSummary() {
  const { items, totalPrice, totalQty, setQty, removeItem } = useCart();
  const isEmpty = items.length === 0;
  const ship = shippingFee(totalQty);
  const grand = isEmpty ? 0 : totalPrice + ship;

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
          {items.map((it) => {
            const key = cartLineKey(it);
            const variant = [it.size, it.color].filter(Boolean).join(" · ");
            return (
              <li key={key} className="flex items-center gap-3 py-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={it.img}
                  alt={it.name}
                  className="h-14 w-14 shrink-0 rounded-md object-cover"
                />
                <div className="flex-1">
                  <p className="text-[14px] text-black">{it.name}</p>
                  {variant ? (
                    <p className="mt-0.5 text-[12px] text-black/70">{variant}</p>
                  ) : null}
                  <p className="mt-0.5 text-[12px] text-[#999]">
                    {formatVnd(it.price)}
                  </p>
                </div>

                {/* Quantity stepper */}
                <div className="inline-flex shrink-0 items-center rounded-full border border-black/20">
                  <button
                    type="button"
                    aria-label="Giảm số lượng"
                    onClick={() => setQty(key, it.qty - 1)}
                    className="flex h-8 w-8 items-center justify-center text-black"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-7 text-center text-[14px] text-black">
                    {it.qty}
                  </span>
                  <button
                    type="button"
                    aria-label="Tăng số lượng"
                    onClick={() => setQty(key, it.qty + 1)}
                    className="flex h-8 w-8 items-center justify-center text-black"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>

                <span className="w-24 text-right text-[14px] font-semibold text-[#c2864e]">
                  {formatVnd(it.price * it.qty)}
                </span>

                <button
                  type="button"
                  aria-label="Xóa sản phẩm"
                  onClick={() => removeItem(key)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#999] transition hover:bg-[#fef3f2] hover:text-[#b42318]"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            );
          })}
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
          <span>
            {isEmpty || ship === 0 ? (
              <span className="font-semibold text-[#027a48]">Miễn phí</span>
            ) : (
              formatVnd(ship)
            )}
          </span>
        </div>
        {!isEmpty && ship > 0 ? (
          <p className="text-[13px] text-[#a67b5b]">
            Mua từ 2 sản phẩm để được miễn phí giao hàng!
          </p>
        ) : null}
        <div className="flex justify-between border-t pt-3">
          <span className="font-bold">Tổng tiền</span>
          <span className="text-[18px] font-bold">{formatVnd(grand)}</span>
        </div>
      </div>
    </div>
  );
}
