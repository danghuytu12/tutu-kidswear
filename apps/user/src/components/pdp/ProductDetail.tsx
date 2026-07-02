"use client";

import { useState } from "react";
import { pdpProduct } from "@repo/ui/lib/products";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MinusIcon,
  PlusIcon,
  ExchangeIcon,
  ReturnIcon,
  PhoneIcon,
  DeliveryIcon,
} from "@repo/ui/components/icons";

export function ProductDetail() {
  const { gallery, name, orig, sale, discPct, sizes } = pdpProduct;
  const [active, setActive] = useState(0);
  const [selectedSize, setSelectedSize] = useState(sizes[0]);
  const [qty, setQty] = useState(1);

  const prev = () => setActive((a) => (a - 1 + gallery.length) % gallery.length);
  const next = () => setActive((a) => (a + 1) % gallery.length);

  return (
    <section className="cocandy-container grid gap-8 pb-8 lg:grid-cols-2">
      {/* LEFT: gallery */}
      <div>
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={gallery[active]}
            alt={name}
            className="aspect-square w-full rounded-lg object-cover"
          />
          <button
            type="button"
            aria-label="Ảnh trước"
            onClick={prev}
            className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/70 text-black hover:bg-white"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Ảnh sau"
            onClick={next}
            className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/70 text-black hover:bg-white"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {gallery.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(i)}
              className="shrink-0"
              aria-label={`Ảnh ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`${name} ${i + 1}`}
                className={`h-16 w-16 cursor-pointer rounded object-cover ${
                  i === active ? "ring-2 ring-[#b08560]" : ""
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT: info */}
      <div>
        <h1 className="text-[25px] font-bold text-black">{name}</h1>
        <p className="mt-2 text-[14px] text-[#c4c4c4] line-through">{orig}</p>
        <div className="mt-1 flex items-center gap-3">
          <span className="text-[22px] font-bold text-black">{sale}</span>
          <span className="rounded bg-[#dc2525] px-2 py-0.5 text-[13px] text-white">
            -{discPct}
          </span>
          <a
            href="#"
            className="ml-auto text-[14px] text-[#a67b5b] underline"
          >
            Hướng dẫn chọn size
          </a>
        </div>

        {/* Size selector */}
        <div className="mt-6">
          <p className="text-[12px] text-[#777]">
            size <span className="text-black">{selectedSize}</span>
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {sizes.map((s) => {
              const isActive = s === selectedSize;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSelectedSize(s)}
                  className={`rounded-full px-4 py-1.5 text-[15px] ${
                    isActive
                      ? "bg-black text-white"
                      : "border border-black/20 bg-white text-black"
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        {/* Qty stepper */}
        <div className="mt-6">
          <div className="inline-flex items-center rounded-full border border-black/20">
            <button
              type="button"
              aria-label="Giảm số lượng"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="flex h-10 w-10 items-center justify-center text-black"
            >
              <MinusIcon className="h-4 w-4" />
            </button>
            <span className="w-8 text-center text-[15px] text-black">{qty}</span>
            <button
              type="button"
              aria-label="Tăng số lượng"
              onClick={() => setQty((q) => q + 1)}
              className="flex h-10 w-10 items-center justify-center text-black"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            className="flex-1 rounded bg-[#e3e3e3] py-3 text-[16px] text-black hover:bg-[#d5d5d5]"
          >
            Thêm vào giỏ hàng
          </button>
          <button
            type="button"
            className="flex-1 rounded bg-[#e3e3e3] py-3 text-[16px] text-black hover:bg-[#d5d5d5]"
          >
            Mua ngay
          </button>
        </div>

        {/* Zalo CTA */}
        <p className="mt-4 text-[14px] text-[#a67b5b]">
          Nhấn nút zalo để được tư vấn ngay (8:30 - 23:00) →
        </p>

        {/* Delivery info */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-2 text-[14px]">
            <ExchangeIcon className="h-5 w-5 text-[#b08560]" />
            <span>Đổi cực dễ chỉ cần số điện thoại</span>
          </div>
          <div className="flex items-center gap-2 text-[14px]">
            <ReturnIcon className="h-5 w-5 text-[#b08560]" />
            <span>Đổi trong vòng 15 ngày</span>
          </div>
          <div className="flex items-center gap-2 text-[14px]">
            <PhoneIcon className="h-5 w-5 text-[#b08560]" />
            <span>Hotline 0903241926 hỗ trợ từ 8h30 - 23h mỗi ngày</span>
          </div>
          <div className="flex items-center gap-2 text-[14px]">
            <DeliveryIcon className="h-5 w-5 text-[#b08560]" />
            <span>Giao hàng toàn quốc</span>
          </div>
        </div>
      </div>
    </section>
  );
}
