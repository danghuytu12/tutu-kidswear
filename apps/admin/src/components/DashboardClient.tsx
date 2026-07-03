"use client";

import { useState, useTransition } from "react";
import { Package, ShoppingBag, Users, TrendingUp } from "lucide-react";
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

  async function load(nextFrom: string, nextTo: string) {
    setFrom(nextFrom);
    setTo(nextTo);
    const res = await fetch(
      `/api/stats?from=${nextFrom}&to=${nextTo}`,
      { cache: "no-store" },
    );
    if (!res.ok) return;
    const data = (await res.json()) as { stats: DashboardStats };
    startTransition(() => setStats(data.stats));
  }

  function applyPreset(days: number) {
    void load(dayKeyDaysAgo(days - 1), dayKeyDaysAgo(0));
  }

  const activePreset = PRESETS.find(
    (p) => from === dayKeyDaysAgo(p.days - 1) && to === dayKeyDaysAgo(0),
  )?.days;

  const cards = [
    { label: "Sản phẩm", value: String(stats.productCount), icon: Package, tone: "#b08560" },
    { label: "Đơn trong kỳ", value: String(stats.ordersInRange), icon: ShoppingBag, tone: "#c2864e" },
    { label: "Khách hàng", value: String(stats.customerCount), icon: Users, tone: "#a67b5b" },
    { label: "Doanh thu", value: formatVnd(stats.revenue), icon: TrendingUp, tone: "#8a6647" },
  ];

  return (
    <>
      {/* Filter row — one row, above the content it scopes */}
      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-black/5 bg-white p-3 shadow-sm">
        <div className="flex gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.days}
              type="button"
              onClick={() => applyPreset(p.days)}
              className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium transition ${
                activePreset === p.days
                  ? "bg-[#b08560] text-white"
                  : "bg-black/5 text-black/70 hover:bg-black/10"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2 text-[13px]">
          <span className="text-black/45">Từ</span>
          <input
            type="date"
            value={from}
            max={to}
            onChange={(e) => load(e.target.value, to)}
            className="rounded-lg border border-black/15 px-2.5 py-1.5 text-black outline-none focus:border-[#b08560]"
          />
          <span className="text-black/45">đến</span>
          <input
            type="date"
            value={to}
            min={from}
            onChange={(e) => load(from, e.target.value)}
            className="rounded-lg border border-black/15 px-2.5 py-1.5 text-black outline-none focus:border-[#b08560]"
          />
        </div>
      </div>

      {/* Charts hold their previous render at reduced opacity while refetching */}
      <div className={pending ? "opacity-60 transition-opacity" : "transition-opacity"}>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(({ label, value, icon: Icon, tone }) => (
            <div
              key={label}
              className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-black/50">{label}</span>
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full text-white"
                  style={{ backgroundColor: tone }}
                >
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3 font-display text-[26px] font-bold text-black">
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
