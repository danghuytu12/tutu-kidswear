"use client";

import type { Product } from "@repo/ui/lib/types";

// Neutral cream placeholder shown if a product photo fails to load.
const PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><rect width='400' height='400' fill='%23fbf7ef'/><g fill='none' stroke='%23d9c7b3' stroke-width='6'><rect x='120' y='120' width='160' height='160' rx='16'/><path d='M120 230l45-45 40 40 35-35 40 40'/></g><circle cx='170' cy='165' r='14' fill='%23d9c7b3'/></svg>`,
  );

interface ProductCardProps {
  product: Product;
  /**
   * @deprecated Kept for backward compatibility with existing callers. The
   * quick-add-on-hover overlay was removed, so this prop no longer has any
   * effect.
   */
  hoverAdd?: boolean;
  /** @deprecated No longer used (quick-add overlay removed). */
  sizes?: string[];
}

export function ProductCard({ product }: ProductCardProps) {
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
          className="aspect-square w-full rounded-md transition-transform duration-300 group-hover:scale-105"
        />
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
