"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ClipboardCheck,
  Info,
  Plus,
  Search,
} from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import {
  STOCK_REASON_LABELS,
  type StockMovementDoc,
} from "@repo/ui/lib/db/types";
import {
  RestockSheet,
  StocktakeSheet,
  variantLabel,
  type RestockTarget,
  type StocktakeTarget,
} from "@/components/InventorySheets";

export interface InventoryVariant {
  color: string;
  size: string;
  /** null = not tracked yet (sells without limit). */
  stock: number | null;
  threshold: number;
}

export interface InventoryProduct {
  id: string;
  name: string;
  img: string;
  published: boolean;
  variants: InventoryVariant[];
}

type StockStatus = "untracked" | "out" | "low" | "ok";
type Filter = "all" | Exclude<StockStatus, "ok">;

function statusOf(v: InventoryVariant): StockStatus {
  if (v.stock === null) return "untracked";
  if (v.stock <= 0) return "out";
  if (v.stock <= v.threshold) return "low";
  return "ok";
}

const STATUS_PILL: Record<StockStatus, string> = {
  untracked: "bg-[#F2F4F7] text-[#667085]",
  out: "bg-[#FEF3F2] text-[#B42318]",
  low: "bg-[#FFFAEB] text-[#B54708]",
  ok: "bg-[#ECFDF3] text-[#027A48]",
};

/** Lowercase + strip Vietnamese diacritics so "ao coc" finds "Áo cộc". */
function fold(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d");
}

// Fixed timezone so server and client render the same string (no hydration
// mismatch) regardless of where the server runs.
const timeFormat = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Ho_Chi_Minh",
});

function StockPill({ variant }: { variant: InventoryVariant }) {
  const status = statusOf(variant);
  return (
    <span
      className={cn(
        "inline-flex h-7 min-w-12 items-center justify-center rounded-full px-2.5 text-sm font-semibold tabular-nums",
        STATUS_PILL[status],
      )}
      title={
        status === "untracked"
          ? "Chưa nhập kho — bán không giới hạn"
          : status === "low"
            ? `Sắp hết (ngưỡng ${variant.threshold})`
            : undefined
      }
    >
      {variant.stock === null ? "—" : variant.stock}
    </span>
  );
}

function SummaryTile({
  label,
  value,
  hint,
  tone,
  active,
  onClick,
}: {
  label: string;
  value: number;
  hint: string;
  tone: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-xl border bg-white p-3 text-left transition sm:p-4",
        active ? "border-[#b08560] ring-2 ring-[#b08560]/20" : "border-[#E4E7EC] hover:border-[#D0D5DD]",
      )}
    >
      <span className="block truncate text-xs text-[#667085] sm:text-[13px]">{label}</span>
      <span className={cn("mt-0.5 block text-[22px] font-bold tabular-nums sm:text-2xl", tone)}>
        {value.toLocaleString("vi-VN")}
      </span>
      <span className="block truncate text-[11px] text-[#98A2B3] sm:text-xs">{hint}</span>
    </button>
  );
}

function ProductStockCard({
  product,
  onRestock,
  onStocktake,
}: {
  product: InventoryProduct;
  onRestock: (variant: InventoryVariant) => void;
  onStocktake: () => void;
}) {
  const tracked = product.variants.filter((v) => v.stock !== null);
  const total = tracked.reduce((sum, v) => sum + (v.stock ?? 0), 0);
  return (
    <li className="overflow-hidden rounded-xl border border-[#E4E7EC] bg-white">
      <div className="flex items-center gap-3 p-3 sm:p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.img} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-[15px] font-semibold text-[#1D2939]">{product.name}</p>
          <p className="text-xs text-[#667085]">
            {tracked.length > 0 ? (
              <>
                Tồn <span className="font-semibold text-[#344054]">{total}</span>
              </>
            ) : (
              "Chưa nhập kho"
            )}
            {" · "}
            {product.variants.length} biến thể
            {product.published ? null : " · Nháp"}
          </p>
        </div>
        <button
          type="button"
          onClick={onStocktake}
          className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg border border-[#D0D5DD] px-3 text-sm font-medium text-[#344054] transition hover:bg-[#F9FAFB] active:bg-[#F2F4F7]"
        >
          <ClipboardCheck className="h-4 w-4" />
          Kiểm kê
        </button>
      </div>
      <ul className="divide-y divide-[#F2F4F7] border-t border-[#F2F4F7]">
        {product.variants.map((v) => (
          <li key={`${v.color}|${v.size}`} className="flex items-center gap-3 py-1.5 pr-2 pl-3 sm:pr-3 sm:pl-4">
            <span className="min-w-0 flex-1 truncate text-sm text-[#344054]">{variantLabel(v)}</span>
            <StockPill variant={v} />
            <button
              type="button"
              onClick={() => onRestock(v)}
              aria-label={`Nhập kho ${variantLabel(v)}`}
              className="inline-flex h-10 items-center gap-1 rounded-lg px-3 text-sm font-medium text-[#8a6647] transition hover:bg-[#f7f1ea] active:bg-[#f2ece3]"
            >
              <Plus className="h-4 w-4" />
              Nhập
            </button>
          </li>
        ))}
      </ul>
    </li>
  );
}

function StockHistory({ movements }: { movements: StockMovementDoc[] }) {
  if (movements.length === 0) {
    return (
      <p className="rounded-xl border border-[#E4E7EC] bg-white px-4 py-12 text-center text-sm text-[#667085]">
        Chưa có lần nhập / xuất kho nào.
      </p>
    );
  }
  return (
    <ul className="divide-y divide-[#F2F4F7] overflow-hidden rounded-xl border border-[#E4E7EC] bg-white">
      {movements.map((m) => {
        const inbound = m.delta > 0;
        return (
          <li key={m._id} className="flex gap-3 p-3 sm:p-4">
            <span
              className={cn(
                "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                inbound ? "bg-[#ECFDF3] text-[#027A48]" : "bg-[#FEF3F2] text-[#B42318]",
              )}
            >
              {inbound ? <ArrowDownToLine className="h-4 w-4" /> : <ArrowUpFromLine className="h-4 w-4" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 text-sm font-medium text-[#1D2939]">{m.productName}</p>
              <p className="text-xs text-[#667085]">
                {variantLabel(m)} · {STOCK_REASON_LABELS[m.reason]}
                {m.orderId ? (
                  <>
                    {" · "}
                    <Link href={`/orders?q=${m.orderId}`} className="font-medium text-[#b08560]">
                      Đơn …{m.orderId.slice(-6)}
                    </Link>
                  </>
                ) : null}
              </p>
              {m.note ? <p className="mt-0.5 text-xs italic text-[#98A2B3]">{m.note}</p> : null}
            </div>
            <div className="shrink-0 text-right">
              <p
                className={cn(
                  "text-sm font-semibold tabular-nums",
                  inbound ? "text-[#027A48]" : "text-[#B42318]",
                )}
              >
                {inbound ? `+${m.delta}` : m.delta}
              </p>
              <p className="text-xs text-[#98A2B3]">còn {m.stockAfter}</p>
              <p className="text-[11px] text-[#98A2B3]">{timeFormat.format(new Date(m.createdAt))}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function InventoryClient({
  products,
  movements,
}: {
  products: InventoryProduct[];
  movements: StockMovementDoc[];
}) {
  const [tab, setTab] = useState<"stock" | "history">("stock");
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [restock, setRestock] = useState<RestockTarget | null>(null);
  const [restockOpen, setRestockOpen] = useState(false);
  const [stocktake, setStocktake] = useState<StocktakeTarget | null>(null);
  const [stocktakeOpen, setStocktakeOpen] = useState(false);

  const summary = useMemo(() => {
    const all = products.flatMap((p) => p.variants);
    return {
      units: all.reduce((sum, v) => sum + (v.stock ?? 0), 0),
      low: all.filter((v) => statusOf(v) === "low").length,
      out: all.filter((v) => statusOf(v) === "out").length,
      untracked: all.filter((v) => statusOf(v) === "untracked").length,
    };
  }, [products]);

  const visible = useMemo(() => {
    const q = fold(query.trim());
    return products
      .filter((p) => !q || fold(p.name).includes(q))
      .map((p) => ({
        ...p,
        variants: filter === "all" ? p.variants : p.variants.filter((v) => statusOf(v) === filter),
      }))
      .filter((p) => p.variants.length > 0);
  }, [products, filter, query]);

  const toggleFilter = (next: Filter) => setFilter((cur) => (cur === next ? "all" : next));

  return (
    <>
      {/* Stock / history switch */}
      <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-black/[0.04] p-1 sm:inline-grid sm:w-80">
        {(
          [
            ["stock", "Tồn kho"],
            ["history", "Lịch sử"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            aria-pressed={tab === key}
            className={cn(
              "h-10 rounded-lg text-sm font-medium transition",
              tab === key ? "bg-white text-[#1D2939] shadow-sm" : "text-[#667085]",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "history" ? (
        <StockHistory movements={movements} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-4">
            <SummaryTile
              label="Tổng tồn kho"
              value={summary.units}
              hint="sản phẩm trong kho"
              tone="text-[#1D2939]"
              active={filter === "all"}
              onClick={() => setFilter("all")}
            />
            <SummaryTile
              label="Sắp hết"
              value={summary.low}
              hint="biến thể dưới ngưỡng"
              tone="text-[#B54708]"
              active={filter === "low"}
              onClick={() => toggleFilter("low")}
            />
            <SummaryTile
              label="Hết hàng"
              value={summary.out}
              hint="biến thể tồn 0"
              tone="text-[#B42318]"
              active={filter === "out"}
              onClick={() => toggleFilter("out")}
            />
            <SummaryTile
              label="Chưa nhập kho"
              value={summary.untracked}
              hint="bán không giới hạn"
              tone="text-[#667085]"
              active={filter === "untracked"}
              onClick={() => toggleFilter("untracked")}
            />
          </div>

          {summary.untracked > 0 && filter === "all" ? (
            <p className="mt-3 flex items-start gap-2 rounded-lg bg-[#f7f1ea] px-3 py-2.5 text-[13px] text-[#8a6647]">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Biến thể <strong>chưa nhập kho</strong> vẫn bán không giới hạn. Bấm{" "}
                <strong>Kiểm kê</strong> để nhập số lượng thực tế và bắt đầu theo dõi tồn kho.
              </span>
            </p>
          ) : null}

          <div className="relative mt-4">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#98A2B3]" />
            <input
              type="search"
              enterKeyHint="search"
              aria-label="Tìm sản phẩm"
              placeholder="Tìm sản phẩm..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-11 w-full rounded-lg border border-[#E4E7EC] bg-white pr-4 pl-12 text-sm text-[#1D2939] placeholder:text-[#98A2B3] focus:border-[#b08560]/40 focus:outline-none focus:ring-3 focus:ring-[#b08560]/10 sm:w-96"
            />
          </div>

          {visible.length === 0 ? (
            <p className="mt-4 rounded-xl border border-[#E4E7EC] bg-white px-4 py-12 text-center text-sm text-[#667085]">
              {products.length === 0
                ? "Chưa có sản phẩm nào."
                : "Không có biến thể nào khớp bộ lọc."}
            </p>
          ) : (
            <ul className="mt-4 grid gap-3 lg:grid-cols-2 lg:gap-4">
              {visible.map((p) => {
                // Sheets always act on the full product, not the filtered view.
                const full = products.find((x) => x.id === p.id) ?? p;
                return (
                  <ProductStockCard
                    key={p.id}
                    product={p}
                    onRestock={(variant) => {
                      setRestock({ product: full, variant, nonce: Date.now() });
                      setRestockOpen(true);
                    }}
                    onStocktake={() => {
                      setStocktake({ product: full, nonce: Date.now() });
                      setStocktakeOpen(true);
                    }}
                  />
                );
              })}
            </ul>
          )}
        </>
      )}

      <RestockSheet target={restock} open={restockOpen} onOpenChange={setRestockOpen} />
      <StocktakeSheet target={stocktake} open={stocktakeOpen} onOpenChange={setStocktakeOpen} />
    </>
  );
}
