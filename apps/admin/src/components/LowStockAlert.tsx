import Link from "next/link";
import { AlertTriangle, ChevronRight } from "lucide-react";
import type { ProductDoc, ProductVariant } from "@repo/ui/lib/db/types";

type LowItem = { product: ProductDoc; variant: ProductVariant };

/** Dashboard banner listing variants at/below their low-stock threshold. */
export function LowStockAlert({ items }: { items: LowItem[] }) {
  if (items.length === 0) return null;
  const out = items.filter((i) => (i.variant.stock ?? 0) <= 0).length;
  // Most urgent first: sold out, then the smallest counts.
  const top = [...items]
    .sort((a, b) => (a.variant.stock ?? 0) - (b.variant.stock ?? 0))
    .slice(0, 3);
  return (
    <Link
      href="/inventory"
      className="mt-4 block rounded-2xl border border-[#FEDF89] bg-[#FFFAEB] p-4 transition hover:border-[#FEC84B] sm:mt-6"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FEF0C7] text-[#B54708]">
          <AlertTriangle className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold text-[#93370D]">
            {items.length} biến thể sắp hết hàng
          </p>
          <p className="text-xs text-[#B54708]">
            {out > 0 ? `${out} đã hết · ` : ""}Bấm để nhập kho
          </p>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-[#B54708]" />
      </div>
      <ul className="mt-3 space-y-1.5 border-t border-[#FEDF89] pt-3">
        {top.map(({ product, variant }) => (
          <li
            key={`${product._id}|${variant.color}|${variant.size}`}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <span className="min-w-0 flex-1 truncate text-[#7A2E0E]">{product.name}</span>
            <span className="shrink-0 text-xs text-[#B54708]">
              {[variant.color, variant.size].filter(Boolean).join(" · ")}
            </span>
            <span className="shrink-0 font-semibold tabular-nums text-[#B42318]">
              {(variant.stock ?? 0) <= 0 ? "Hết" : `Còn ${variant.stock}`}
            </span>
          </li>
        ))}
      </ul>
    </Link>
  );
}
