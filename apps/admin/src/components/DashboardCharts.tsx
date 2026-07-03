"use client";

import { useState } from "react";
import type {
  DashboardStats,
  DailyPoint,
  StatusSlice,
  TopProduct,
} from "@repo/ui/lib/db/repositories/stats";

// ---- Palette (dataviz reference, brand-tuned) ------------------------------
// Sequential brand hues for single-series charts; validated status colors for
// the status breakdown (paired with direct labels, never colour-alone).
const REVENUE = "#b08560"; // brand brown
const ORDERS = "#c2864e"; // brand amber
const TOP = "#8a6647"; // deep brown
const STATUS_COLORS: Record<StatusSlice["status"], string> = {
  pending: "#fab219", // warning
  paid: "#0ca30c", // good
  shipped: "#2a78d6", // info blue
  cancelled: "#d03b3b", // critical
};

const INK = "#0b0b0b";
const MUTED = "#898781";
const GRID = "#e1e0d9";

function formatVndShort(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}tr`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(n);
}
function formatVnd(n: number): string {
  return `${n.toLocaleString("vi-VN")} ₫`;
}
// "2026-07-03" -> "03/07"
function shortDate(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
      <h2 className="font-display text-[18px] font-bold text-black">{title}</h2>
      {subtitle ? (
        <p className="mt-0.5 text-[13px] text-black/45">{subtitle}</p>
      ) : null}
      <div className="mt-4">{children}</div>
    </div>
  );
}

// ---- Line chart: revenue per day --------------------------------------------
function RevenueChart({ daily }: { daily: DailyPoint[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 560;
  const H = 220;
  const padL = 44;
  const padR = 16;
  const padT = 16;
  const padB = 28;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const max = Math.max(1, ...daily.map((d) => d.revenue));
  const x = (i: number) =>
    padL + (daily.length <= 1 ? innerW / 2 : (i / (daily.length - 1)) * innerW);
  const y = (v: number) => padT + innerH - (v / max) * innerH;

  const path = daily
    .map((d, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(d.revenue)}`)
    .join(" ");
  const area = `${path} L${x(daily.length - 1)},${padT + innerH} L${x(0)},${padT + innerH} Z`;
  const ticks = [0, max / 2, max];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      role="img"
      aria-label="Doanh thu theo ngày"
    >
      {ticks.map((t) => (
        <g key={t}>
          <line x1={padL} y1={y(t)} x2={W - padR} y2={y(t)} stroke={GRID} strokeWidth={1} />
          <text x={padL - 6} y={y(t) + 3} textAnchor="end" fontSize={10} fill={MUTED}>
            {formatVndShort(t)}
          </text>
        </g>
      ))}
      <path d={area} fill={REVENUE} opacity={0.1} />
      <path d={path} fill="none" stroke={REVENUE} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      {daily.map((d, i) => (
        <g key={d.date}>
          {i % 5 === 0 ? (
            <text x={x(i)} y={H - 10} textAnchor="middle" fontSize={9} fill={MUTED}>
              {shortDate(d.date)}
            </text>
          ) : null}
          {/* wide invisible hit target */}
          <rect
            x={x(i) - innerW / daily.length / 2}
            y={padT}
            width={innerW / daily.length}
            height={innerH}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          />
          {hover === i ? (
            <circle cx={x(i)} cy={y(d.revenue)} r={4} fill={REVENUE} stroke="#fff" strokeWidth={2} />
          ) : null}
        </g>
      ))}
      {hover !== null ? (
        <g>
          <line x1={x(hover)} y1={padT} x2={x(hover)} y2={padT + innerH} stroke={REVENUE} strokeWidth={1} opacity={0.4} />
          <text
            x={Math.min(Math.max(x(hover), padL + 40), W - padR - 40)}
            y={padT + 10}
            textAnchor="middle"
            fontSize={11}
            fontWeight={700}
            fill={INK}
          >
            {shortDate(daily[hover].date)}: {formatVnd(daily[hover].revenue)}
          </text>
        </g>
      ) : null}
    </svg>
  );
}

// ---- Column chart: orders per day -------------------------------------------
function OrdersChart({ daily }: { daily: DailyPoint[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 560;
  const H = 220;
  const padL = 30;
  const padR = 16;
  const padT = 16;
  const padB = 28;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const max = Math.max(1, ...daily.map((d) => d.orders));
  const slot = innerW / daily.length;
  const barW = Math.min(20, slot - 6);
  const ticks = [0, Math.ceil(max / 2), max];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Số đơn theo ngày">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={padL} y1={padT + innerH - (t / max) * innerH} x2={W - padR} y2={padT + innerH - (t / max) * innerH} stroke={GRID} strokeWidth={1} />
          <text x={padL - 6} y={padT + innerH - (t / max) * innerH + 3} textAnchor="end" fontSize={10} fill={MUTED}>
            {t}
          </text>
        </g>
      ))}
      {daily.map((d, i) => {
        const h = (d.orders / max) * innerH;
        const bx = padL + i * slot + (slot - barW) / 2;
        const by = padT + innerH - h;
        return (
          <g key={d.date} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <rect x={padL + i * slot} y={padT} width={slot} height={innerH} fill="transparent" />
            {d.orders > 0 ? (
              <rect x={bx} y={by} width={barW} height={h} rx={4} fill={ORDERS} opacity={hover === i ? 1 : 0.85} />
            ) : null}
            {i % 5 === 0 ? (
              <text x={padL + i * slot + slot / 2} y={H - 10} textAnchor="middle" fontSize={9} fill={MUTED}>
                {shortDate(d.date)}
              </text>
            ) : null}
            {hover === i ? (
              <text x={padL + i * slot + slot / 2} y={by - 5} textAnchor="middle" fontSize={11} fontWeight={700} fill={INK}>
                {d.orders}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

// ---- Status breakdown: horizontal bars with direct labels -------------------
function StatusChart({ slices }: { slices: StatusSlice[] }) {
  const total = slices.reduce((s, x) => s + x.count, 0);
  const max = Math.max(1, ...slices.map((s) => s.count));
  return (
    <div className="space-y-3">
      {slices.map((s) => {
        const pct = total ? Math.round((s.count / total) * 100) : 0;
        return (
          <div key={s.status}>
            <div className="mb-1 flex items-center justify-between text-[13px]">
              <span className="flex items-center gap-2 text-black">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: STATUS_COLORS[s.status] }}
                />
                {s.label}
              </span>
              <span className="tabular-nums text-black/60">
                {s.count} đơn ({pct}%)
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-black/5">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(s.count / max) * 100}%`,
                  backgroundColor: STATUS_COLORS[s.status],
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---- Top products: ranked horizontal bars -----------------------------------
function TopProductsChart({ products }: { products: TopProduct[] }) {
  if (products.length === 0) {
    return <p className="py-8 text-center text-[14px] text-black/40">Chưa có dữ liệu bán hàng.</p>;
  }
  const max = Math.max(1, ...products.map((p) => p.qty));
  return (
    <div className="space-y-3">
      {products.map((p) => (
        <div key={p.name}>
          <div className="mb-1 flex items-center justify-between gap-3 text-[13px]">
            <span className="min-w-0 flex-1 truncate text-black" title={p.name}>
              {p.name}
            </span>
            <span className="tabular-nums whitespace-nowrap text-black/60">
              {p.qty} sp · {formatVnd(p.revenue)}
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-black/5">
            <div
              className="h-full rounded-full"
              style={{ width: `${(p.qty / max) * 100}%`, backgroundColor: TOP }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DashboardCharts({ stats }: { stats: DashboardStats }) {
  const range =
    stats.from && stats.to ? `${shortDate(stats.from)} – ${shortDate(stats.to)}` : "";
  return (
    <div className="mt-8 grid gap-4 lg:grid-cols-2">
      <Card title="Doanh thu theo ngày" subtitle={range}>
        <RevenueChart daily={stats.daily} />
      </Card>
      <Card title="Số đơn theo ngày" subtitle={range}>
        <OrdersChart daily={stats.daily} />
      </Card>
      <Card title="Đơn theo trạng thái" subtitle={`Trong kỳ ${range}`}>
        <StatusChart slices={stats.statusBreakdown} />
      </Card>
      <Card title="Sản phẩm bán chạy" subtitle="Theo số lượng bán ra trong kỳ">
        <TopProductsChart products={stats.topProducts} />
      </Card>
    </div>
  );
}
