"use client";

import { ProductCard } from "@repo/ui/components/ProductCard";
import { Reveal } from "@repo/ui/components/motion";
import type { Product } from "@repo/ui/lib/types";

const SORT_OPTIONS = [
  "Mới nhất",
  "Giá tăng dần",
  "Giá giảm dần",
  "Bán chạy",
];

export function CategoryLayout({ products }: { products: Product[] }) {
  return (
    <Reveal>
      <div className="cocandy-container py-6">
        <div className="mb-6 flex items-center justify-end gap-3">
          <span className="text-[14px] text-[#777]">Sắp xếp</span>
          <select className="rounded-full border border-black/15 px-4 py-2 text-[14px]">
            {SORT_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        {products.length === 0 ? (
          <p className="py-16 text-center text-[15px] text-[#999]">
            Chưa có sản phẩm nào.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.href} product={p} hoverAdd={false} />
            ))}
          </div>
        )}
      </div>
    </Reveal>
  );
}
