import { listProducts } from "./products";
import { listOrders } from "./orders";
import { listCustomers } from "./customers";
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from "../types";
import type { OrderDoc } from "../types";

/** Revenue + order count for one calendar day. */
export interface DailyPoint {
  /** ISO date (YYYY-MM-DD). */
  date: string;
  revenue: number;
  orders: number;
}

/** Order count for one status. */
export interface StatusSlice {
  status: OrderDoc["status"];
  label: string;
  count: number;
}

/** A product ranked by units sold. */
export interface TopProduct {
  name: string;
  qty: number;
  revenue: number;
}

/** Aggregated figures + analytics series for the admin overview screen. */
export interface DashboardStats {
  productCount: number;
  /** Number of orders placed within the selected range. */
  ordersInRange: number;
  customerCount: number;
  /** Revenue (VND) from non-cancelled orders within the selected range. */
  revenue: number;
  /** The resolved date window (YYYY-MM-DD), echoed back for the UI. */
  from: string;
  to: string;
  /** Per-day revenue + order count across the range, oldest→newest. */
  daily: DailyPoint[];
  /** Order count per status within the range (all statuses, lifecycle order). */
  statusBreakdown: StatusSlice[];
  /** Best-selling products by units within the range, highest first. */
  topProducts: TopProduct[];
}

/** Default trailing window (days) when no explicit range is given. */
const DEFAULT_WINDOW = 30;

/** Local YYYY-MM-DD key for a Date (not UTC — matches the admin's clock). */
function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** True when `key` is a valid YYYY-MM-DD date string. */
function isDateKey(key: unknown): key is string {
  return typeof key === "string" && /^\d{4}-\d{2}-\d{2}$/.test(key);
}

/**
 * Resolve the [from, to] window. Both are inclusive YYYY-MM-DD keys. Invalid or
 * missing input falls back to the trailing DEFAULT_WINDOW ending today; a
 * reversed range is swapped so from ≤ to.
 */
function resolveRange(
  now: Date,
  from?: string,
  to?: string,
): { from: string; to: string } {
  const toKey = isDateKey(to) ? to : dayKey(now);
  let fromKey: string;
  if (isDateKey(from)) {
    fromKey = from;
  } else {
    const d = new Date(now);
    d.setDate(d.getDate() - (DEFAULT_WINDOW - 1));
    fromKey = dayKey(d);
  }
  return fromKey <= toKey
    ? { from: fromKey, to: toKey }
    : { from: toKey, to: fromKey };
}

/** All YYYY-MM-DD keys from `from` to `to` inclusive. */
function enumerateDays(from: string, to: string): string[] {
  const keys: string[] = [];
  const cur = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  // Cap to a sane maximum so a bad range can't spin forever.
  for (let i = 0; cur <= end && i < 366; i++) {
    keys.push(dayKey(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return keys;
}

/** Build the daily revenue/order series across the [from, to] window. */
function buildDaily(orders: OrderDoc[], from: string, to: string): DailyPoint[] {
  const revByDay = new Map<string, number>();
  const cntByDay = new Map<string, number>();
  for (const o of orders) {
    if (o.status === "cancelled") continue;
    const key = dayKey(new Date(o.createdAt));
    revByDay.set(key, (revByDay.get(key) ?? 0) + o.total);
    cntByDay.set(key, (cntByDay.get(key) ?? 0) + 1);
  }
  return enumerateDays(from, to).map((key) => ({
    date: key,
    revenue: revByDay.get(key) ?? 0,
    orders: cntByDay.get(key) ?? 0,
  }));
}

/** Count orders in every status (zero-filled, lifecycle order). */
function buildStatusBreakdown(orders: OrderDoc[]): StatusSlice[] {
  return ORDER_STATUSES.map((status) => ({
    status,
    label: ORDER_STATUS_LABELS[status],
    count: orders.filter((o) => o.status === status).length,
  }));
}

/** Rank products by units sold across the given (non-cancelled) orders. */
function buildTopProducts(orders: OrderDoc[], limit = 6): TopProduct[] {
  const byName = new Map<string, { qty: number; revenue: number }>();
  for (const o of orders) {
    if (o.status === "cancelled") continue;
    for (const item of o.items) {
      const cur = byName.get(item.name) ?? { qty: 0, revenue: 0 };
      cur.qty += item.qty;
      cur.revenue += item.price * item.qty;
      byName.set(item.name, cur);
    }
  }
  return [...byName.entries()]
    .map(([name, v]) => ({ name, qty: v.qty, revenue: v.revenue }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, limit);
}

/**
 * Gather all figures + analytics for the overview dashboard, scoped to a date
 * range. `from`/`to` are inclusive YYYY-MM-DD keys; omit them for the default
 * trailing 30-day window ending today. `now` is injected for testability.
 * Product and customer totals are store-wide (not range-scoped); every other
 * figure reflects orders placed within [from, to].
 */
export async function getDashboardStats(
  now: Date,
  from?: string,
  to?: string,
): Promise<DashboardStats> {
  const range = resolveRange(now, from, to);
  const [products, orders, customers] = await Promise.all([
    listProducts(),
    listOrders(),
    listCustomers(),
  ]);

  // Orders whose creation day falls inside [from, to].
  const inRange = orders.filter((o) => {
    const key = dayKey(new Date(o.createdAt));
    return key >= range.from && key <= range.to;
  });

  const revenue = inRange
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.total, 0);

  return {
    productCount: products.length,
    ordersInRange: inRange.length,
    customerCount: customers.length,
    revenue,
    from: range.from,
    to: range.to,
    daily: buildDaily(inRange, range.from, range.to),
    statusBreakdown: buildStatusBreakdown(inRange),
    topProducts: buildTopProducts(inRange),
  };
}
