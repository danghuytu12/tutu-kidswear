"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@repo/ui/components/ui/toast";
import { Spinner } from "@repo/ui/components/Spinner";
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  type OrderDoc,
} from "@repo/ui/lib/db/types";

type Status = OrderDoc["status"];

const STATUS_STYLES: Record<Status, string> = {
  pending: "bg-[#FFFAEB] text-[#B54708]",
  paid: "bg-[#ECFDF3] text-[#027A48]",
  shipped: "bg-[#EFF8FF] text-[#175CD3]",
  cancelled: "bg-[#FEF3F2] text-[#B42318]",
};

const STATUS_LABELS = ORDER_STATUS_LABELS;

// Inline status changer for one order row. Optimistically shows the new value,
// PATCHes the admin API, and refreshes the server-rendered list on success.
export function OrderStatusSelect({
  id,
  status,
}: {
  id: string;
  status: Status;
}) {
  const router = useRouter();
  const toast = useToast();
  const [value, setValue] = useState<Status>(status);
  const [busy, setBusy] = useState(false);
  const [pending, startTransition] = useTransition();

  async function onChange(next: Status) {
    if (busy || next === value) return;
    const prev = value;
    setValue(next);
    setBusy(true);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error("update failed");
      // Inside a transition so `busy` lasts until the server re-render lands,
      // rather than clearing while the table still shows the old value.
      startTransition(() => router.refresh());
    } catch {
      setValue(prev); // revert on failure
      toast.error("Không thể cập nhật trạng thái", "Vui lòng thử lại.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <select
        value={value}
        disabled={busy}
        onChange={(e) => onChange(e.target.value as Status)}
        aria-label="Trạng thái đơn hàng"
        className={`cursor-pointer rounded-full border-0 px-3.5 py-2 text-[13px] font-medium lg:px-2.5 lg:py-1 lg:text-xs outline-none focus:ring-2 focus:ring-[#b08560]/30 disabled:opacity-50 ${STATUS_STYLES[value]}`}
      >
        {ORDER_STATUSES.map((s) => (
          <option key={s} value={s} className="bg-white text-[#344054]">
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      {busy || pending ? (
        <Spinner className="h-3.5 w-3.5 text-[#667085]" />
      ) : null}
    </span>
  );
}
