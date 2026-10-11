"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
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

/** Full order code from the ObjectId, prefixed with "#". */
function orderCode(id: string): string {
  return `#${id}`;
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
  const [, startTransition] = useTransition();
  const [count, setCount] = useState(0);
  const [orders, setOrders] = useState<NotifOrder[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) return; // keep previous state; retried next poll
      const data = (await res.json()) as {
        count: number;
        orders: NotifOrder[];
      };
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

  // Close the dropdown on outside tap/click (pointerdown covers touch too)
  // and on Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function openOrder(id: string) {
    // Optimistic: drop the row + decrement now; mark-read is best-effort.
    setOrders((cur) => cur.filter((o) => o._id !== id));
    setCount((c) => Math.max(0, c - 1));
    setOpen(false);
    fetch(`/api/notifications/${id}`, { method: "PATCH" }).catch(() => {});
    startTransition(() => router.push("/orders"));
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label="Thông báo"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-black/60 hover:bg-[#f2ece3] active:bg-[#f2ece3]"
      >
        <Bell className="h-5 w-5" />
        {count > 0 ? (
          <span className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#dc2525] px-1 text-[11px] font-bold text-white ring-2 ring-white">
            {count > 9 ? "9+" : count}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="fixed inset-x-3 top-[3.75rem] z-[120] overflow-hidden rounded-xl border border-[#E4E7EC] bg-white shadow-lg sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80">
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
            <ul className="max-h-[min(24rem,calc(100dvh-10rem))] overflow-y-auto overscroll-contain">
              {orders.map((o) => (
                <li key={o._id}>
                  <button
                    type="button"
                    onClick={() => openOrder(o._id)}
                    className="flex w-full cursor-pointer flex-col gap-0.5 border-b border-[#F2F4F7] px-4 py-3 text-left hover:bg-[#faf6ef] active:bg-[#faf6ef]"
                  >
                    <span className="break-all text-sm font-medium text-[#344054]">
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
