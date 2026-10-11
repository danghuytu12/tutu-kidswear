"use client";

import { useRef, useState, useTransition } from "react";
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
  MinusIcon,
  PlusIcon,
  ExchangeIcon,
  ReturnIcon,
  PhoneIcon,
  DeliveryIcon,
} from "@repo/ui/components/icons";
import { MotionButton } from "@repo/ui/components/motion";
import { Spinner } from "@repo/ui/components/Spinner";
import { ProductGallery } from "./ProductGallery";
import { MobileBuyBar } from "./MobileBuyBar";

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
  /** Per-variant stock; `stock: null` = not tracked (sells without limit). */
  variants?: { color: string; size: string; stock: number | null }[];
}

/** Show "Chỉ còn N" once a variant's stock is at or below this. */
const LOW_STOCK_HINT = 5;

const norm = (s: string) => s.trim().toLowerCase();

function OptionGroup({
  label,
  options,
  value,
  onChange,
  isDisabled,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  /** Sold-out options render struck through and can't be picked. */
  isDisabled?: (v: string) => boolean;
}) {
  return (
    <div className="mt-6">
      <p className="text-[12px] text-[#777]">
        {label} <span className="text-black">{value}</span>
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((o) => {
          const disabled = isDisabled?.(o) ?? false;
          return (
            <button
              key={o}
              type="button"
              onClick={() => onChange(o)}
              disabled={disabled}
              aria-label={disabled ? `${o} (hết hàng)` : undefined}
              className={`rounded-full px-4 py-1.5 text-[15px] ${
                o === value
                  ? "bg-black text-white"
                  : disabled
                    ? "border border-dashed border-black/15 bg-white text-black/30 line-through"
                    : "border border-black/20 bg-white text-black"
              }`}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ProductDetail({ data }: { data?: ProductDetailData }) {
  const gallery =
    data?.gallery && data.gallery.length > 0
      ? data.gallery
      : pdpProduct.gallery;
  const name = data?.name ?? pdpProduct.name;
  const orig = data?.orig ?? pdpProduct.orig;
  const sale = data?.sale ?? pdpProduct.sale;
  const discPct = data?.discPct ?? pdpProduct.discPct;
  const sizes =
    data?.sizes && data.sizes.length > 0 ? data.sizes : pdpProduct.sizes;
  const colors = data?.colors ?? [];
  const variants = data?.variants ?? [];

  /** Stock of a colour×size: a number, null (untracked = unlimited), or
   *  undefined when the product has no such combination. */
  const stockFor = (color: string, size: string) =>
    variants.find((v) => norm(v.color) === norm(color) && norm(v.size) === norm(size))
      ?.stock;
  const colorSoldOut = (color: string) => {
    const ofColor = variants.filter((v) => norm(v.color) === norm(color));
    return ofColor.length > 0 && ofColor.every((v) => v.stock === 0);
  };
  const firstSizeFor = (color: string) =>
    sizes.find((s) => stockFor(color, s) !== 0) ?? sizes[0];

  // Start on something that can actually be bought.
  const firstAvailable = variants.find((v) => v.stock !== 0);
  const [selectedColor, setSelectedColor] = useState(
    firstAvailable && colors.includes(firstAvailable.color)
      ? firstAvailable.color
      : (colors[0] ?? ""),
  );
  const [selectedSize, setSelectedSize] = useState(
    firstAvailable && sizes.includes(firstAvailable.size)
      ? firstAvailable.size
      : sizes[0],
  );
  const [qtyInput, setQty] = useState(1);

  const currentStock = stockFor(selectedColor, selectedSize);
  const soldOut = currentStock === 0;
  const maxQty = typeof currentStock === "number" ? Math.max(1, currentStock) : Infinity;
  // Clamp rather than store: switching to a variant with less stock lowers it.
  const qty = Math.min(qtyInput, maxQty);
  const pickColor = (color: string) => {
    setSelectedColor(color);
    // Don't leave the shopper on a size that's gone in the new colour.
    if (stockFor(color, selectedSize) === 0) setSelectedSize(firstSizeFor(color));
  };
  const actionsRef = useRef<HTMLDivElement>(null);

  const router = useRouter();
  const [navigating, startTransition] = useTransition();
  const { addItem } = useCart();
  const toast = useToast();
  const href = data?.href ?? "/products/ao-coc-cotton-van-mong-nau-tay-raclan";
  // The selected variant, captured at add-to-cart time. Empty selections
  // (a product with no colours, or no sizes) become undefined so they don't
  // create a spurious "" variant on the cart line.
  const variant = () => ({
    size: selectedSize || undefined,
    color: selectedColor || undefined,
  });
  const variantLabel = () =>
    [selectedSize, selectedColor].filter(Boolean).join(" · ");
  const addToCart = () => {
    if (soldOut) return;
    addItem(
      { href, name, img: gallery[0], price: parsePriceVnd(sale), ...variant() },
      qty,
    );
    const label = variantLabel();
    toast.success(
      "Đã thêm vào giỏ hàng",
      `${name} × ${qty}${label ? ` (${label})` : ""}`,
    );
  };
  const buyNow = () => {
    if (soldOut) return;
    addItem(
      { href, name, img: gallery[0], price: parsePriceVnd(sale), ...variant() },
      qty,
    );
    // /checkout reads the DB on every request, so keep the button busy for the
    // whole navigation rather than appearing to do nothing.
    startTransition(() => router.push("/checkout"));
  };

  // Colour / size / qty pickers — rendered inline and in the mobile buy sheet,
  // both bound to the same state.
  const variantControls = (
    <>
      {colors.length > 0 ? (
        <OptionGroup
          label="màu"
          options={colors}
          value={selectedColor}
          onChange={pickColor}
          isDisabled={colorSoldOut}
        />
      ) : null}
      <OptionGroup
        label="size"
        options={sizes}
        value={selectedSize}
        onChange={setSelectedSize}
        isDisabled={(s) => stockFor(selectedColor, s) === 0}
      />
      {soldOut ? (
        <p className="mt-2 text-[14px] font-medium text-[#dc2525]">
          Phân loại này đã hết hàng
        </p>
      ) : typeof currentStock === "number" && currentStock <= LOW_STOCK_HINT ? (
        <p className="mt-2 text-[14px] font-medium text-[#c2410c]">
          Chỉ còn {currentStock} sản phẩm
        </p>
      ) : null}
      <div className="mt-6">
        <div className="inline-flex items-center rounded-full border border-black/20">
          <MotionButton
            type="button"
            aria-label="Giảm số lượng"
            onClick={() => setQty(Math.max(1, qty - 1))}
            className="flex h-10 w-10 items-center justify-center text-black"
          >
            <MinusIcon className="h-4 w-4" />
          </MotionButton>
          <span className="w-8 text-center text-[15px] text-black">{qty}</span>
          <MotionButton
            type="button"
            aria-label="Tăng số lượng"
            onClick={() => setQty(Math.min(qty + 1, maxQty))}
            disabled={qty >= maxQty}
            className="flex h-10 w-10 items-center justify-center text-black"
          >
            <PlusIcon className="h-4 w-4" />
          </MotionButton>
        </div>
      </div>
    </>
  );

  return (
    <section className="cocandy-container grid gap-8 pb-8 lg:grid-cols-2">
      {/* LEFT: gallery */}
      <ProductGallery images={gallery} name={name} />

      {/* RIGHT: info */}
      <div>
        <h1 className="text-[25px] font-bold text-black">{name}</h1>
        <div className="mt-1 flex items-center gap-3">
          <span className="text-[22px] font-bold text-black">{sale}</span>
          {/* <span className="rounded bg-[#dc2525] px-2 py-0.5 text-[13px] text-white">
            -{discPct}
          </span> */}
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

        {variantControls}

        {/* Buttons */}
        <div ref={actionsRef} className="mt-6 flex gap-3">
          {soldOut ? (
            <button
              type="button"
              disabled
              className="flex-1 rounded bg-[#f1f1f1] py-3 text-[16px] text-black/40"
            >
              Hết hàng
            </button>
          ) : (
            <>
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
                disabled={navigating}
                className="flex-1 rounded bg-[#e3e3e3] py-3 text-[16px] text-black hover:bg-[#d5d5d5] disabled:opacity-60"
              >
                {navigating ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <Spinner />
                    Mua ngay
                  </span>
                ) : (
                  "Mua ngay"
                )}
              </MotionButton>
            </>
          )}
        </div>

        {/* Zalo CTA */}

        {/* Delivery info */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-2 text-[14px]">
            <ExchangeIcon className="h-5 w-5 text-[#b08560]" />
            <span>Đổi cực dễ chỉ cần số điện thoại</span>
          </div>
          <div className="flex items-center gap-2 text-[14px]">
            <ReturnIcon className="h-5 w-5 text-[#b08560]" />
            <span>Kiểm tra hàng trước khi nhận</span>
          </div>
          <div className="flex items-center gap-2 text-[14px]">
            <PhoneIcon className="h-5 w-5 text-[#b08560]" />
            <span>Hotline 0834494182 hỗ trợ từ 8h30 - 20h mỗi ngày</span>
          </div>
          <div className="flex items-center gap-2 text-[14px]">
            <DeliveryIcon className="h-5 w-5 text-[#b08560]" />
            <span>Giao hàng toàn quốc</span>
          </div>
        </div>
      </div>

      <MobileBuyBar
        watchRef={actionsRef}
        name={name}
        price={sale}
        image={gallery[0]}
        variantLabel={variantLabel()}
        controls={variantControls}
        onAddToCart={addToCart}
        onBuyNow={buyNow}
        buying={navigating}
        soldOut={soldOut}
      />
    </section>
  );
}
