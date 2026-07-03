"use client";

import { useState } from "react";
import { ProductCard } from "@repo/ui/components/ProductCard";
import {
  newProducts,
  bestsellerProducts,
} from "@repo/ui/lib/products";
import type { Product } from "@repo/ui/lib/types";

type TabKey = "new" | "best";

export function ProductTabsSection({
  newList = newProducts,
  bestList = bestsellerProducts,
}: {
  newList?: Product[];
  bestList?: Product[];
}) {
  const TABS = [
    { key: "new" as const, label: "SẢN PHẨM MỚI", products: newList },
    { key: "best" as const, label: "SẢN PHẨM BÁN CHẠY", products: bestList },
  ];
  const [active, setActive] = useState<TabKey>("new");
  const activeTab = TABS.find((t) => t.key === active) ?? TABS[0];

  return (
    <section className="cocandy-container py-8">
      <div className="mb-6 flex items-center justify-center">
        {TABS.map((tab, i) => (
          <div key={tab.key} className="flex items-center">
            {i > 0 && <span className="mx-4 h-6 w-px bg-black/20" />}
            <button
              type="button"
              onClick={() => setActive(tab.key)}
              className={`font-display text-[22px] font-bold uppercase transition-colors ${
                active === tab.key
                  ? "border-b-[3px] border-[#b08560] pb-1 text-black"
                  : "text-[#999]"
              }`}
            >
              {tab.label}
            </button>
          </div>
        ))}
      </div>

      <div
        key={active}
        className="grid grid-cols-2 gap-x-4 gap-y-8 transition-opacity duration-300 lg:grid-cols-4"
      >
        {activeTab.products.map((p) => (
          <ProductCard key={p.href + p.name} product={p} />
        ))}
      </div>
    </section>
  );
}
