"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
} from "@repo/ui/components/ui/drawer";
import { useToast } from "@repo/ui/components/ui/toast";
import { Spinner } from "@repo/ui/components/Spinner";
import { cn } from "@repo/ui/lib/utils";
import type {
  InventoryProduct,
  InventoryVariant,
} from "@/components/InventoryClient";

export function variantLabel(v: Pick<InventoryVariant, "color" | "size">): string {
  return [v.color, v.size].filter(Boolean).join(" · ") || "Mặc định";
}

const digitsOnly = (value: string) => value.replace(/\D/g, "");

const fieldClass =
  "h-12 w-full rounded-lg border border-[#D0D5DD] bg-white px-4 text-[16px] text-[#1D2939] tabular-nums outline-none placeholder:text-[#98A2B3] focus:border-[#b08560] focus:ring-3 focus:ring-[#b08560]/15";

// Bottom sheet on phones; a centred 30rem sheet from sm up. Uses margin (not a
// transform) to centre, because the drawer animates with `transform`.
const SHEET_CLASS = "sm:left-1/2 sm:right-auto sm:-ml-[15rem] sm:w-[30rem]";

function SheetHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-4">
      <DrawerTitle className="text-[17px] text-[#1D2939]">{title}</DrawerTitle>
      <p className="mt-0.5 line-clamp-2 text-sm text-[#667085]">{subtitle}</p>
    </div>
  );
}

function SubmitButton({ busy, children }: { busy: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#b08560] text-[15px] font-semibold text-white transition hover:bg-[#8a6647] disabled:bg-[#d8c3ad]"
    >
      {busy ? <Spinner /> : null}
      {children}
    </button>
  );
}

/** POST JSON and surface the API's Vietnamese error message on failure. */
async function postJson(url: string, body: unknown): Promise<void> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "Có lỗi xảy ra, vui lòng thử lại.");
  }
}

// ---- Nhập kho -------------------------------------------------------------

/** `nonce` changes on every open so the form starts fresh each time. */
export type RestockTarget = {
  product: InventoryProduct;
  variant: InventoryVariant;
  nonce: number;
};
export type StocktakeTarget = { product: InventoryProduct; nonce: number };

function RestockForm({
  target,
  onDone,
}: {
  target: RestockTarget;
  onDone: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [qty, setQty] = useState("1");
  const [cost, setCost] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  const { product, variant } = target;
  const n = Number(qty) || 0;
  const current = variant.stock ?? 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (n <= 0 || busy) return;
    setBusy(true);
    try {
      await postJson("/api/inventory/restock", {
        productId: product.id,
        color: variant.color,
        size: variant.size,
        qty: n,
        costPrice: cost ? Number(cost) : undefined,
        note,
      });
      toast.success(`Đã nhập ${n} sản phẩm`, `${product.name} — ${variantLabel(variant)}`);
      startTransition(() => router.refresh());
      onDone();
    } catch (err) {
      toast.error("Không thể nhập kho", err instanceof Error ? err.message : undefined);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="px-4 pt-3 pb-4 sm:px-6">
      <SheetHeader title="Nhập kho" subtitle={`${product.name} — ${variantLabel(variant)}`} />

      <label htmlFor="restock-qty" className="mb-1.5 block text-sm font-medium text-[#344054]">
        Số lượng nhập
      </label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Giảm"
          onClick={() => setQty(String(Math.max(1, n - 1)))}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-[#D0D5DD] text-[#344054] active:bg-[#F2F4F7]"
        >
          <Minus className="h-5 w-5" />
        </button>
        <input
          id="restock-qty"
          inputMode="numeric"
          autoComplete="off"
          enterKeyHint="done"
          value={qty}
          onChange={(e) => setQty(digitsOnly(e.target.value))}
          onFocus={(e) => e.target.select()}
          className={cn(fieldClass, "text-center text-lg font-semibold")}
        />
        <button
          type="button"
          aria-label="Tăng"
          onClick={() => setQty(String(n + 1))}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-[#D0D5DD] text-[#344054] active:bg-[#F2F4F7]"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
      <p className="mt-2 text-sm text-[#667085]">
        Tồn kho:{" "}
        <span className="font-medium text-[#344054]">
          {variant.stock === null ? "chưa nhập" : current}
        </span>{" "}
        → <span className="font-semibold text-[#027A48]">{current + n}</span>
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="restock-cost" className="mb-1.5 block text-sm font-medium text-[#344054]">
            Giá nhập / sp <span className="font-normal text-[#98A2B3]">(tuỳ chọn)</span>
          </label>
          <div className="relative">
            <input
              id="restock-cost"
              inputMode="numeric"
              autoComplete="off"
              placeholder="90.000"
              value={cost ? Number(cost).toLocaleString("vi-VN") : ""}
              onChange={(e) => setCost(digitsOnly(e.target.value))}
              className={cn(fieldClass, "pr-9")}
            />
            <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-[#98A2B3]">
              ₫
            </span>
          </div>
        </div>
        <div>
          <label htmlFor="restock-note" className="mb-1.5 block text-sm font-medium text-[#344054]">
            Ghi chú <span className="font-normal text-[#98A2B3]">(tuỳ chọn)</span>
          </label>
          <input
            id="restock-note"
            placeholder="VD: Lô hàng 12/10"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={fieldClass}
          />
        </div>
      </div>

      <SubmitButton busy={busy}>Nhập {n > 0 ? n : ""} sản phẩm</SubmitButton>
    </form>
  );
}

export function RestockSheet({
  target,
  open,
  onOpenChange,
}: {
  target: RestockTarget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className={SHEET_CLASS}>
        {target ? (
          <RestockForm
            key={target.nonce}
            target={target}
            onDone={() => onOpenChange(false)}
          />
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}

// ---- Kiểm kê ----------------------------------------------------------------

function StocktakeForm({
  product,
  onDone,
}: {
  product: InventoryProduct;
  onDone: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  // Counted value per variant; prefilled with the current stock, blank when
  // the variant isn't tracked yet (blank = leave it untracked).
  const [counts, setCounts] = useState(() =>
    product.variants.map((v) => (v.stock === null ? "" : String(v.stock))),
  );
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  const changes = product.variants
    .map((v, i) => ({ v, value: counts[i] }))
    .filter(({ v, value }) => value !== "" && Number(value) !== v.stock);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (changes.length === 0) {
      onDone();
      return;
    }
    setBusy(true);
    try {
      await postJson("/api/inventory/stocktake", {
        productId: product.id,
        counts: changes.map(({ v, value }) => ({
          color: v.color,
          size: v.size,
          count: Number(value),
        })),
        note,
      });
      toast.success("Đã lưu kiểm kê", `${product.name} — ${changes.length} biến thể`);
      startTransition(() => router.refresh());
      onDone();
    } catch (err) {
      toast.error("Không thể lưu kiểm kê", err instanceof Error ? err.message : undefined);
      startTransition(() => router.refresh());
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="px-4 pt-3 pb-4 sm:px-6">
      <SheetHeader
        title="Kiểm kê"
        subtitle={`${product.name} — nhập số lượng đếm thực tế`}
      />
      <ul className="divide-y divide-[#F2F4F7] rounded-xl border border-[#E4E7EC]">
        {product.variants.map((v, i) => {
          const value = counts[i];
          const diff = value === "" ? null : Number(value) - (v.stock ?? 0);
          return (
            <li key={i} className="flex items-center gap-3 px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[#344054]">{variantLabel(v)}</p>
                <p className="text-xs text-[#98A2B3]">
                  {v.stock === null ? "Chưa nhập kho" : `Hiện tại: ${v.stock}`}
                  {diff !== null && (v.stock === null || diff !== 0) ? (
                    <span
                      className={cn(
                        "ml-1.5 font-semibold",
                        diff > 0 ? "text-[#027A48]" : diff < 0 ? "text-[#B42318]" : "text-[#667085]",
                      )}
                    >
                      {diff > 0 ? `+${diff}` : diff}
                    </span>
                  ) : null}
                </p>
              </div>
              <input
                aria-label={`Số lượng thực tế ${variantLabel(v)}`}
                inputMode="numeric"
                autoComplete="off"
                enterKeyHint="next"
                placeholder="—"
                value={value}
                onChange={(e) =>
                  setCounts((cur) => cur.map((c, j) => (j === i ? digitsOnly(e.target.value) : c)))
                }
                onFocus={(e) => e.target.select()}
                className="h-11 w-20 rounded-lg border border-[#D0D5DD] text-center text-[16px] font-semibold tabular-nums text-[#1D2939] outline-none focus:border-[#b08560] focus:ring-3 focus:ring-[#b08560]/15"
              />
            </li>
          );
        })}
      </ul>

      <label htmlFor="stocktake-note" className="mt-4 mb-1.5 block text-sm font-medium text-[#344054]">
        Ghi chú <span className="font-normal text-[#98A2B3]">(tuỳ chọn)</span>
      </label>
      <input
        id="stocktake-note"
        placeholder="VD: Kiểm kê cuối tháng"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className={fieldClass}
      />

      <SubmitButton busy={busy}>
        {changes.length > 0 ? `Lưu ${changes.length} thay đổi` : "Không có thay đổi"}
      </SubmitButton>
    </form>
  );
}

export function StocktakeSheet({
  target,
  open,
  onOpenChange,
}: {
  target: StocktakeTarget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className={SHEET_CLASS}>
        {target ? (
          <StocktakeForm
            key={target.nonce}
            product={target.product}
            onDone={() => onOpenChange(false)}
          />
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}
