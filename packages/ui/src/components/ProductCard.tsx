"use client";

import type { Product } from "@repo/ui/lib/types";
import { useCart } from "./cart/CartContext";
import { useToast } from "./ui/toast";
import { parsePriceVnd } from "../lib/cart";

const DEFAULT_SIZES = ["73", "80", "90", "100", "110", "120", "130", "140", "150"];

// Neutral cream placeholder shown if a product photo fails to load.
const PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><rect width='400' height='400' fill='%23fbf7ef'/><g fill='none' stroke='%23d9c7b3' stroke-width='6'><rect x='120' y='120' width='160' height='160' rx='16'/><path d='M120 230l45-45 40 40 35-35 40 40'/></g><circle cx='170' cy='165' r='14' fill='%23d9c7b3'/></svg>`,
  );

interface ProductCardProps {
  product: Product;
  hoverAdd?: boolean;
  sizes?: string[];
}

export function ProductCard({
  product,
  hoverAdd = true,
  sizes = DEFAULT_SIZES,
}: ProductCardProps) {
  const { addItem } = useCart();
  const toast = useToast();
  const add = () => {
    addItem({
      href: product.href,
      name: product.name,
      img: product.img,
      price: parsePriceVnd(product.sale),
    });
    toast.success("Đã thêm vào giỏ hàng", product.name);
  };

  return (
    <a href={product.href} className="group block">
      <div className="relative overflow-hidden rounded-md bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.img}
          alt={product.name}
          loading="lazy"
          onError={(e) => {
            const el = e.currentTarget;
            if (el.src !== PLACEHOLDER) el.src = PLACEHOLDER;
          }}
          className="aspect-square w-full rounded-md object-cover"
        />
        {hoverAdd && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 bg-white/90 px-2 py-2 opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                add();
              }}
              className="w-full text-center text-[14px] font-bold text-black"
            >
              Thêm nhanh vào giỏ +
            </button>
            {/* <div className="mt-1 flex flex-wrap justify-center gap-x-2 gap-y-0.5">
              {sizes.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    add();
                  }}
                  className="text-[16px] leading-tight text-black hover:text-[#c2864e]"
                >
                  {s}
                </button>
              ))}
            </div> */}
          </div>
        )}
      </div>

      <p className="mt-2 line-clamp-2 text-[14px] leading-snug text-black">
        {product.name}
      </p>

      <div className="mt-1 flex flex-wrap items-baseline gap-x-1.5">
        <span className="text-[14px] font-bold text-[#c2864e]">
          {product.sale}
        </span>
        {product.disc && (
          <span className="text-[13px] text-[#dc2525]">{product.disc}</span>
        )}
        {product.orig && (
          <span className="text-[12px] text-[#777] line-through">
            {product.orig}
          </span>
        )}
      </div>
    </a>
  );
}
