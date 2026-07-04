"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@repo/ui/components/cart/CartContext";
import { useToast } from "@repo/ui/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/ui/dialog";
import { parsePriceVnd } from "@repo/ui/lib/cart";
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
import { MotionButton } from "@repo/ui/components/motion";

// Optional overrides from the DB product (by slug). Rich fields not stored in
// the DB (reviews) still come from the static pdpProduct.
export interface ProductDetailData {
  name?: string;
  orig?: string;
  sale?: string;
  discPct?: string;
  gallery?: string[];
  href?: string;
  /** Distinct sizes from the product's variants. */
  sizes?: string[];
  /** Distinct colours from the product's variants. */
  colors?: string[];
  /** Rich-text (HTML) description authored in admin. */
  description?: string;
  /** URL of the size-chart image. */
  sizeChartImage?: string;
}

export function ProductDetail({ data }: { data?: ProductDetailData }) {
  const gallery =
    data?.gallery && data.gallery.length > 0 ? data.gallery : pdpProduct.gallery;
  const name = data?.name ?? pdpProduct.name;
  const orig = data?.orig ?? pdpProduct.orig;
  const sale = data?.sale ?? pdpProduct.sale;
  const discPct = data?.discPct ?? pdpProduct.discPct;
  const sizes = data?.sizes && data.sizes.length > 0 ? data.sizes : pdpProduct.sizes;
  const colors = data?.colors ?? [];
  const [active, setActive] = useState(0);
  const [selectedSize, setSelectedSize] = useState(sizes[0]);
  const [selectedColor, setSelectedColor] = useState(colors[0] ?? "");
  const [qty, setQty] = useState(1);

  const router = useRouter();
  const { addItem } = useCart();
  const toast = useToast();
  const href = data?.href ?? "/products/ao-coc-cotton-van-mong-nau-tay-raclan";
  const addToCart = () => {
    addItem(
      { href, name, img: gallery[0], price: parsePriceVnd(sale) },
      qty,
    );
    toast.success("Đã thêm vào giỏ hàng", `${name} × ${qty}`);
  };
  const buyNow = () => {
    addItem(
      { href, name, img: gallery[0], price: parsePriceVnd(sale) },
      qty,
    );
    router.push("/checkout");
  };

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
              key={i}
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
          {data?.sizeChartImage ? (
            <Dialog>
              <DialogTrigger className="ml-auto cursor-pointer text-[14px] text-[#a67b5b] underline">
                Hướng dẫn chọn size
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogTitle>Hướng dẫn chọn size</DialogTitle>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={data.sizeChartImage}
                  alt="Bảng size"
                  className="w-full rounded-lg border border-black/10"
                />
              </DialogContent>
            </Dialog>
          ) : (
            <span className="ml-auto text-[14px] text-[#a67b5b] underline">
              Hướng dẫn chọn size
            </span>
          )}
        </div>

        {/* Color selector */}
        {colors.length > 0 ? (
          <div className="mt-6">
            <p className="text-[12px] text-[#777]">
              màu <span className="text-black">{selectedColor}</span>
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {colors.map((c) => {
                const isActive = c === selectedColor;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedColor(c)}
                    className={`rounded-full px-4 py-1.5 text-[15px] ${
                      isActive
                        ? "bg-black text-white"
                        : "border border-black/20 bg-white text-black"
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

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
            <MotionButton
              type="button"
              aria-label="Giảm số lượng"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="flex h-10 w-10 items-center justify-center text-black"
            >
              <MinusIcon className="h-4 w-4" />
            </MotionButton>
            <span className="w-8 text-center text-[15px] text-black">{qty}</span>
            <MotionButton
              type="button"
              aria-label="Tăng số lượng"
              onClick={() => setQty((q) => q + 1)}
              className="flex h-10 w-10 items-center justify-center text-black"
            >
              <PlusIcon className="h-4 w-4" />
            </MotionButton>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-6 flex gap-3">
          <MotionButton
            type="button"
            onClick={addToCart}
            className="flex-1 rounded bg-[#e3e3e3] py-3 text-[16px] text-black hover:bg-[#d5d5d5]"
          >
            Thêm vào giỏ hàng
          </MotionButton>
          <MotionButton
            type="button"
            onClick={buyNow}
            className="flex-1 rounded bg-[#e3e3e3] py-3 text-[16px] text-black hover:bg-[#d5d5d5]"
          >
            Mua ngay
          </MotionButton>
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
            <span>Hotline 0834494182 hỗ trợ từ 8h30 - 23h mỗi ngày</span>
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
