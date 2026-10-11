"use client";

import { useState, useTransition } from "react";
import { Package, ShoppingBag, Users, TrendingUp } from "lucide-react";
import { Spinner } from "@repo/ui/components/Spinner";
import type { DashboardStats } from "@repo/ui/lib/db/repositories/stats";
import { formatVnd } from "@repo/ui/lib/cart";
import { DashboardCharts } from "@/components/DashboardCharts";

// YYYY-MM-DD for a Date offset by `daysAgo` from today (local clock).
function dayKeyDaysAgo(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const PRESETS = [
  { label: "7 ngày", days: 7 },
  { label: "30 ngày", days: 30 },
  { label: "90 ngày", days: 90 },
] as const;

export function DashboardClient({ initial }: { initial: DashboardStats }) {
  const [stats, setStats] = useState(initial);
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [pending, startTransition] = useTransition();

  // The whole fetch runs inside the transition, not just the state update —
  // otherwise `pending` flips for a single frame once the request has already
  // finished, and the wait itself shows no feedback at all.
  function load(nextFrom: string, nextTo: string) {
    setFrom(nextFrom);
    setTo(nextTo);
    startTransition(async () => {
      const res = await fetch(`/api/stats?from=${nextFrom}&to=${nextTo}`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as { stats: DashboardStats };
      setStats(data.stats);
    });
  }

  function applyPreset(days: number) {
    load(dayKeyDaysAgo(days - 1), dayKeyDaysAgo(0));
  }

  const activePreset = PRESETS.find(
    (p) => from === dayKeyDaysAgo(p.days - 1) && to === dayKeyDaysAgo(0),
  )?.days;

  const cards = [
    {
      label: "Sản phẩm",
      value: String(stats.productCount),
      icon: Package,
      tone: "#b08560",
    },
    {
      label: "Đơn trong kỳ",
      value: String(stats.ordersInRange),
      icon: ShoppingBag,
      tone: "#c2864e",
    },
    {
      label: "Khách hàng",
      value: String(stats.customerCount),
      icon: Users,
      tone: "#a67b5b",
    },
    {
      label: "Doanh thu",
      value: formatVnd(stats.revenue),
      icon: TrendingUp,
      tone: "#8a6647",
      wide: true,
    },
  ];

  return (
    <>
      {/* Filter: presets as a segmented control, then the custom range.
          Stacks on phones, one row from sm up. */}
      <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-black/5 bg-white p-3 shadow-sm sm:mt-6 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-black/[0.04] p-1 sm:flex">
          {PRESETS.map((p) => (
            <button
              key={p.days}
              type="button"
              onClick={() => applyPreset(p.days)}
              aria-pressed={activePreset === p.days}
              className={`h-9 rounded-lg px-3.5 text-[13px] font-medium transition ${
                activePreset === p.days
                  ? "bg-[#b08560] text-white shadow-sm"
                  : "text-black/70 hover:bg-black/5"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-[13px] sm:ml-auto sm:flex">
          <label className="sr-only" htmlFor="stats-from">Từ ngày</label>
          <input
            id="stats-from"
            type="date"
            value={from}
            max={to}
            onChange={(e) => load(e.target.value, to)}
            className="h-10 min-w-0 rounded-lg border border-black/15 px-2.5 text-black outline-none focus:border-[#b08560]"
          />
          <span className="text-black/45">→</span>
          <label className="sr-only" htmlFor="stats-to">Đến ngày</label>
          <input
            id="stats-to"
            type="date"
            value={to}
            min={from}
            onChange={(e) => load(from, e.target.value)}
            className="h-10 min-w-0 rounded-lg border border-black/15 px-2.5 text-black outline-none focus:border-[#b08560]"
          />
          {pending ? <Spinner className="text-[#b08560] sm:order-first" /> : null}
        </div>
      </div>

      {/* Charts hold their previous render at reduced opacity while refetching */}
      <div
        className={
          pending ? "opacity-60 transition-opacity" : "transition-opacity"
        }
      >
        {/* Phones: revenue leads full width, the three counts share a row. */}
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          {cards.map(({ label, value, icon: Icon, tone, wide }) => (
            <div
              key={label}
              className={`rounded-2xl border border-black/5 bg-white p-3 shadow-sm sm:p-5 ${
                wide ? "order-first col-span-3 sm:order-none sm:col-span-1" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[12px] text-black/50 sm:text-[13px]">{label}</span>
                <span
                  className={`h-7 w-7 shrink-0 items-center justify-center rounded-full text-white sm:flex sm:h-9 sm:w-9 ${
                    wide ? "flex" : "hidden"
                  }`}
                  style={{ backgroundColor: tone }}
                >
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <div
                className={`mt-1 truncate font-display font-bold text-black sm:mt-3 sm:text-[26px] ${
                  wide ? "text-[26px]" : "text-[22px]"
                }`}
              >
                {value}
              </div>
            </div>
          ))}
        </div>

        <DashboardCharts stats={stats} />
      </div>
    </>
  );
}
