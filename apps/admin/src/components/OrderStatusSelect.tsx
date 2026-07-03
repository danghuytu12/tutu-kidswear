"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ORDER_STATUSES, type OrderDoc } from "@repo/ui/lib/db/types";

type Status = OrderDoc["status"];

const STATUS_STYLES: Record<Status, string> = {
  pending: "bg-[#FFFAEB] text-[#B54708]",
  paid: "bg-[#ECFDF3] text-[#027A48]",
  shipped: "bg-[#EFF8FF] text-[#175CD3]",
  cancelled: "bg-[#FEF3F2] text-[#B42318]",
};

const STATUS_LABELS: Record<Status, string> = {
  pending: "Chờ xử lý",
  paid: "Đã thanh toán",
  shipped: "Đã giao",
  cancelled: "Đã hủy",
};

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
  const [value, setValue] = useState<Status>(status);
  const [busy, setBusy] = useState(false);

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
      router.refresh();
    } catch {
      setValue(prev); // revert on failure
    } finally {
      setBusy(false);
    }
  }

  return (
    <select
      value={value}
      disabled={busy}
      onChange={(e) => onChange(e.target.value as Status)}
      aria-label="Trạng thái đơn hàng"
      className={`cursor-pointer rounded-full border-0 px-2.5 py-1 text-xs font-medium outline-none focus:ring-2 focus:ring-[#465FFF]/30 disabled:opacity-50 ${STATUS_STYLES[value]}`}
    >
      {ORDER_STATUSES.map((s) => (
        <option key={s} value={s} className="bg-white text-[#344054]">
          {STATUS_LABELS[s]}
        </option>
      ))}
    </select>
  );
}
