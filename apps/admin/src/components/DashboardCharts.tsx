"use client";

import { useEffect, useRef, useState } from "react";
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

/**
 * Measures its box and renders the chart at that real pixel size, so SVG text
 * keeps its font size on phones instead of shrinking with a fixed viewBox.
 */
function ChartBox({
  empty,
  children,
}: {
  empty: boolean;
  children: (w: number, h: number) => React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ w: Math.round(width), h: Math.round(height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    // The chart is absolutely positioned so its pixel width never feeds back
    // into the box's own size (which would stop it from shrinking).
    <div ref={ref} className="relative h-[190px] w-full touch-pan-y select-none sm:h-[220px]">
      <div className="absolute inset-0 overflow-hidden">
        {size.w === 0 ? null : empty ? (
          <p className="flex h-full items-center justify-center text-[14px] text-black/40">
            Chưa có dữ liệu trong kỳ.
          </p>
        ) : (
          children(size.w, size.h)
        )}
      </div>
    </div>
  );
}

/** Show every Nth date label so labels (~48px each) never overlap. */
function labelStep(count: number, innerW: number): number {
  return Math.max(1, Math.ceil(count / Math.max(2, Math.floor(innerW / 48))));
}

/**
 * Tooltip pill drawn in the reserved band above the plot, centred on `x` but
 * kept inside [minX, maxX] so it never clips at the chart edges.
 */
function ChartTip({
  x,
  text,
  minX,
  maxX,
}: {
  x: number;
  text: string;
  minX: number;
  maxX: number;
}) {
  const w = text.length * 6.8 + 16;
  const cx = Math.min(Math.max(x, minX + w / 2), maxX - w / 2);
  return (
    <g pointerEvents="none">
      <rect x={cx - w / 2} y={2} width={w} height={22} rx={11} fill="#fff" stroke={GRID} />
      <text x={cx} y={17} textAnchor="middle" fontSize={12} fontWeight={700} fill={INK}>
        {text}
      </text>
    </g>
  );
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
    <div className="min-w-0 rounded-2xl border border-black/5 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="font-display text-[18px] font-bold text-black">{title}</h2>
      {subtitle ? (
        <p className="mt-0.5 text-[13px] text-black/45">{subtitle}</p>
      ) : null}
      <div className="mt-4">{children}</div>
    </div>
  );
}

// ---- Line chart: revenue per day --------------------------------------------
function RevenueSvg({ daily, W, H }: { daily: DailyPoint[]; W: number; H: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const padL = 44;
  const padR = 16;
  const padT = 32; // top band holds the tooltip
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
  const step = labelStep(daily.length, innerW);
  const tip =
    hover !== null
      ? `${shortDate(daily[hover].date)}: ${formatVnd(daily[hover].revenue)}`
      : "";

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      role="img"
      aria-label="Doanh thu theo ngày"
      onPointerLeave={() => setHover(null)}
    >
      {ticks.map((t) => (
        <g key={t}>
          <line x1={padL} y1={y(t)} x2={W - padR} y2={y(t)} stroke={GRID} strokeWidth={1} />
          <text x={padL - 6} y={y(t) + 4} textAnchor="end" fontSize={11} fill={MUTED}>
            {formatVndShort(t)}
          </text>
        </g>
      ))}
      <path d={area} fill={REVENUE} opacity={0.1} />
      <path d={path} fill="none" stroke={REVENUE} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      {daily.map((d, i) => (
        <g key={d.date}>
          {i % step === 0 ? (
            <text x={x(i)} y={H - 8} textAnchor="middle" fontSize={11} fill={MUTED}>
              {shortDate(d.date)}
            </text>
          ) : null}
          {/* wide invisible hit target — pointer events so a tap shows it too */}
          <rect
            x={x(i) - innerW / daily.length / 2}
            y={padT}
            width={innerW / daily.length}
            height={innerH}
            fill="transparent"
            onPointerEnter={() => setHover(i)}
            onPointerDown={() => setHover(i)}
          />
          {hover === i ? (
            <circle cx={x(i)} cy={y(d.revenue)} r={4} fill={REVENUE} stroke="#fff" strokeWidth={2} />
          ) : null}
        </g>
      ))}
      {hover !== null ? (
        <g>
          <line x1={x(hover)} y1={padT} x2={x(hover)} y2={padT + innerH} stroke={REVENUE} strokeWidth={1} opacity={0.4} />
          <ChartTip x={x(hover)} text={tip} minX={0} maxX={W} />
        </g>
      ) : null}
    </svg>
  );
}

// ---- Column chart: orders per day -------------------------------------------
function OrdersSvg({ daily, W, H }: { daily: DailyPoint[]; W: number; H: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const padL = 30;
  const padR = 16;
  const padT = 32; // top band holds the tooltip
  const padB = 28;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const max = Math.max(1, ...daily.map((d) => d.orders));
  const slot = innerW / Math.max(1, daily.length);
  // 70% of the slot, capped at 20px; never negative on 90-day ranges.
  const barW = Math.max(1, Math.min(20, slot * 0.7));
  const ticks = [...new Set([0, Math.ceil(max / 2), max])];
  const step = labelStep(daily.length, innerW);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      role="img"
      aria-label="Số đơn theo ngày"
      onPointerLeave={() => setHover(null)}
    >
      {ticks.map((t) => (
        <g key={t}>
          <line x1={padL} y1={padT + innerH - (t / max) * innerH} x2={W - padR} y2={padT + innerH - (t / max) * innerH} stroke={GRID} strokeWidth={1} />
          <text x={padL - 6} y={padT + innerH - (t / max) * innerH + 4} textAnchor="end" fontSize={11} fill={MUTED}>
            {t}
          </text>
        </g>
      ))}
      {daily.map((d, i) => {
        const h = (d.orders / max) * innerH;
        const bx = padL + i * slot + (slot - barW) / 2;
        const by = padT + innerH - h;
        return (
          <g key={d.date} onPointerEnter={() => setHover(i)} onPointerDown={() => setHover(i)}>
            <rect x={padL + i * slot} y={padT} width={slot} height={innerH} fill="transparent" />
            {d.orders > 0 ? (
              <rect x={bx} y={by} width={barW} height={h} rx={4} fill={ORDERS} opacity={hover === i ? 1 : 0.85} />
            ) : null}
            {i % step === 0 ? (
              <text x={padL + i * slot + slot / 2} y={H - 8} textAnchor="middle" fontSize={11} fill={MUTED}>
                {shortDate(d.date)}
              </text>
            ) : null}
            {hover === i ? (
              <ChartTip
                x={padL + i * slot + slot / 2}
                text={`${shortDate(d.date)}: ${d.orders} đơn`}
                minX={0}
                maxX={W}
              />
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
    <div className="mt-4 grid gap-4 sm:mt-8 lg:grid-cols-2">
      <Card title="Doanh thu theo ngày" subtitle={range}>
        <ChartBox empty={stats.daily.length === 0}>
          {(w, h) => <RevenueSvg daily={stats.daily} W={w} H={h} />}
        </ChartBox>
      </Card>
      <Card title="Số đơn theo ngày" subtitle={range}>
        <ChartBox empty={stats.daily.length === 0}>
          {(w, h) => <OrdersSvg daily={stats.daily} W={w} H={h} />}
        </ChartBox>
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
