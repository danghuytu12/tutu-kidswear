"use client";

import { useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import { saleHeThuProducts } from "@/lib/products";
import { sizeOptions, priceFilterOptions } from "@/lib/navigation";

const SORT_OPTIONS = [
  "Mới nhất",
  "Giá tăng dần",
  "Giá giảm dần",
  "Bán chạy",
];

function RadioCircle({ active }: { active: boolean }) {
  return (
    <span
      className={
        "flex h-4 w-4 items-center justify-center rounded-full border " +
        (active ? "border-[#b08560]" : "border-black/30")
      }
    >
      {active && <span className="h-2 w-2 rounded-full bg-[#b08560]" />}
    </span>
  );
}

function FilterSidebar() {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedPrice, setSelectedPrice] = useState<string | null>(null);

  return (
    <aside>
      <div>
        <h5 className="mb-2 text-[15px] font-bold text-[#6b818c]">Size</h5>
        {sizeOptions.map((opt) => {
          const active = selectedSize === opt.label;
          return (
            <label
              key={opt.label}
              className="flex cursor-pointer items-center gap-2 py-1"
              onClick={() => setSelectedSize(opt.label)}
            >
              <RadioCircle active={active} />
              <span className="text-[15px] text-black">
                {opt.label} ( {opt.weight} )
              </span>
            </label>
          );
        })}
      </div>

      <div className="mt-6">
        <h5 className="mb-2 text-[15px] font-bold text-[#6b818c]">Mức giá</h5>
        {priceFilterOptions.map((opt) => {
          const active = selectedPrice === opt;
          return (
            <label
              key={opt}
              className="flex cursor-pointer items-center gap-2 py-1"
              onClick={() => setSelectedPrice(opt)}
            >
              <RadioCircle active={active} />
              <span className="text-[15px] text-black">{opt}</span>
            </label>
          );
        })}
      </div>
    </aside>
  );
}

export function CategoryLayout() {
  return (
    <div className="cocandy-container grid gap-8 py-6 lg:grid-cols-[240px_1fr]">
      <FilterSidebar />

      <div>
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

        <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3">
          {saleHeThuProducts.map((p) => (
            <ProductCard key={p.href} product={p} hoverAdd={false} />
          ))}
        </div>
      </div>
    </div>
  );
}
