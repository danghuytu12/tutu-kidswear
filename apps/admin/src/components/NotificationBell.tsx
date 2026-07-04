"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";

interface NotifOrder {
  _id: string;
  customerName: string;
  total: number;
  createdAt: string;
}

function formatVnd(n: number): string {
  return `${n.toLocaleString("vi-VN")} ₫`;
}

/** Short order code from the ObjectId: last 8 chars, uppercased (e.g. "#84035766"). */
function orderCode(id: string): string {
  return `#${id.slice(-8).toUpperCase()}`;
}

/** Vietnamese relative time: "vừa xong" / "N phút trước" / "N giờ trước" / "N ngày trước". */
function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const mins = Math.floor((Date.now() - then) / 60000);
  if (mins < 1) return "vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
}

export function NotificationBell() {
  const router = useRouter();
  const [count, setCount] = useState(0);
  const [orders, setOrders] = useState<NotifOrder[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) return; // keep previous state; retried next poll
      const data = (await res.json()) as { count: number; orders: NotifOrder[] };
      setCount(data.count);
      setOrders(data.orders);
    } catch {
      // Network/DB error — keep previous state, retry on next poll.
    }
  }, []);

  // Fetch on mount, then poll every 30s. The initial call intentionally sets
  // state inside the effect (fetching data is a side effect that can't run
  // during render); it's a one-time kickoff paired with the interval setup,
  // not a cascading-render problem.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [load]);

  // Close the dropdown on outside click.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  function openOrder(id: string) {
    // Optimistic: drop the row + decrement now; mark-read is best-effort.
    setOrders((cur) => cur.filter((o) => o._id !== id));
    setCount((c) => Math.max(0, c - 1));
    setOpen(false);
    fetch(`/api/notifications/${id}`, { method: "PATCH" }).catch(() => {});
    router.push("/orders");
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label="Thông báo"
        onClick={() => setOpen((v) => !v)}
        className="relative cursor-pointer rounded-full p-2 text-black/60 hover:bg-[#f2ece3]"
      >
        <Bell className="h-5 w-5" />
        {count > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#dc2525] px-1 text-[10px] font-bold text-white">
            {count > 9 ? "9+" : count}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-[120] mt-2 w-80 overflow-hidden rounded-xl border border-[#E4E7EC] bg-white shadow-lg">
          <div className="border-b border-[#E4E7EC] px-4 py-3">
            <p className="text-sm font-semibold text-[#1D2939]">
              Thông báo đơn hàng
            </p>
          </div>
          {orders.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-[#667085]">
              Không có thông báo mới
            </p>
          ) : (
            <ul className="max-h-96 overflow-y-auto">
              {orders.map((o) => (
                <li key={o._id}>
                  <button
                    type="button"
                    onClick={() => openOrder(o._id)}
                    className="flex w-full cursor-pointer flex-col gap-0.5 border-b border-[#F2F4F7] px-4 py-3 text-left hover:bg-[#faf6ef]"
                  >
                    <span className="text-sm font-medium text-[#344054]">
                      Đơn hàng mới {orderCode(o._id)}
                    </span>
                    <span className="flex items-center justify-between text-xs text-[#667085]">
                      <span>{formatVnd(o.total)}</span>
                      <span>{relativeTime(o.createdAt)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
