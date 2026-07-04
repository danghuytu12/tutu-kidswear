// packages/ui/src/lib/notify/telegram.ts
// Server-only: sends notifications to a Telegram bot. Best-effort — reads creds
// from env, catches/logs all errors, never throws.
import type { OrderDoc } from "../db/types";
import { ORDER_STATUS_LABELS } from "../db/types";
import { formatVnd } from "../cart";

/** Send an arbitrary HTML message to the configured Telegram chat. */
async function sendTelegramMessage(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.warn("[telegram] missing TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID; skipping");
    return;
  }
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
      },
    );
    if (!res.ok) {
      console.error("[telegram] sendMessage failed", res.status, await res.text());
    }
  } catch (err) {
    // Log only the message text — NOT the raw error object, whose message/cause
    // can embed the request URL (which contains the bot token).
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[telegram] request error:", msg.replace(/bot\d+:[\w-]+/g, "bot<redacted>"));
  }
}

function buildMessage(order: OrderDoc): string {
  const lines = order.items
    .map((i) => `• ${i.name} ×${i.qty} = ${formatVnd(i.price * i.qty)}`)
    .join("\n");
  const address = [order.address, order.ward, order.district, order.province]
    .filter(Boolean)
    .join(", ");
  const pay = order.paymentMethod === "qr" ? "Chuyển khoản QR" : "COD";
  return [
    "🛒 <b>ĐƠN HÀNG MỚI</b>",
    `Mã: ${order._id}`,
    `Khách: ${order.customerName}`,
    `SĐT: ${order.customerPhone}`,
    order.customerEmail ? `Email: ${order.customerEmail}` : "",
    `Địa chỉ: ${address}`,
    `Thanh toán: ${pay}`,
    order.note ? `Ghi chú: ${order.note}` : "",
    "",
    "<b>Sản phẩm:</b>",
    lines,
    "",
    `<b>Tổng tiền: ${formatVnd(order.total)}</b>`,
  ]
    .filter((l) => l !== "")
    .join("\n");
}

export async function sendOrderToTelegram(order: OrderDoc): Promise<void> {
  await sendTelegramMessage(buildMessage(order));
}

/** Notify the bot when an order's status changes (admin action). */
export async function sendOrderStatusToTelegram(
  order: OrderDoc,
  previousStatus: OrderDoc["status"],
): Promise<void> {
  const from = ORDER_STATUS_LABELS[previousStatus];
  const to = ORDER_STATUS_LABELS[order.status];
  const text = [
    "🔄 <b>CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG</b>",
    `Mã: ${order._id}`,
    `Khách: ${order.customerName}`,
    `SĐT: ${order.customerPhone}`,
    `Trạng thái: ${from} → <b>${to}</b>`,
    `Tổng tiền: ${formatVnd(order.total)}`,
  ].join("\n");
  await sendTelegramMessage(text);
}

/** Format a YYYY-MM-DD key as DD/MM/YYYY (Vietnamese day-first). */
function formatDayVi(key: string): string {
  const [y, m, d] = key.split("-");
  return `${d}/${m}/${y}`;
}

/** A single product line for the sales reports. */
export interface ReportProduct {
  name: string;
  qty: number;
  revenue: number;
}

/**
 * Render the "products sold" block for a report. Returns the section lines
 * (heading + one line per product), or a single "no sales" line when empty.
 */
function productLines(products: ReportProduct[]): string[] {
  if (products.length === 0) {
    return ["", "<i>Chưa có sản phẩm nào bán được.</i>"];
  }
  const lines = products.map(
    (p) => `• ${p.name}: <b>${p.qty}</b> — ${formatVnd(p.revenue)}`,
  );
  return ["", "<b>Sản phẩm bán được:</b>", ...lines];
}

/**
 * Send the scheduled daily sales report: order count + revenue for a single day.
 * `day` is the reported YYYY-MM-DD (typically yesterday).
 */
export async function sendDailyReportToTelegram(summary: {
  day: string;
  orderCount: number;
  revenue: number;
  products: ReportProduct[];
}): Promise<void> {
  const text = [
    "📊 <b>BÁO CÁO NGÀY</b>",
    `Ngày: ${formatDayVi(summary.day)}`,
    "",
    `Số đơn hàng: <b>${summary.orderCount}</b>`,
    `Doanh thu: <b>${formatVnd(summary.revenue)}</b>`,
    ...productLines(summary.products),
  ].join("\n");
  await sendTelegramMessage(text);
}

/**
 * Send the scheduled weekly sales report: order count + revenue for a Mon→Sat
 * span. `from`/`to` are inclusive YYYY-MM-DD keys.
 */
export async function sendWeeklyReportToTelegram(summary: {
  from: string;
  to: string;
  orderCount: number;
  revenue: number;
  products: ReportProduct[];
}): Promise<void> {
  const text = [
    "📈 <b>BÁO CÁO TUẦN</b>",
    `Từ ${formatDayVi(summary.from)} đến ${formatDayVi(summary.to)} (T2–T7)`,
    "",
    `Số đơn hàng: <b>${summary.orderCount}</b>`,
    `Doanh thu: <b>${formatVnd(summary.revenue)}</b>`,
    ...productLines(summary.products),
  ].join("\n");
  await sendTelegramMessage(text);
}

/**
 * Send the scheduled monthly sales report: order count + revenue for a whole
 * calendar month. `from`/`to` are inclusive YYYY-MM-DD keys spanning the month.
 */
export async function sendMonthlyReportToTelegram(summary: {
  from: string;
  to: string;
  orderCount: number;
  revenue: number;
  products: ReportProduct[];
}): Promise<void> {
  const [y, m] = summary.from.split("-");
  const text = [
    "🗓️ <b>BÁO CÁO THÁNG</b>",
    `Tháng ${m}/${y} (${formatDayVi(summary.from)} – ${formatDayVi(summary.to)})`,
    "",
    `Số đơn hàng: <b>${summary.orderCount}</b>`,
    `Doanh thu: <b>${formatVnd(summary.revenue)}</b>`,
    ...productLines(summary.products),
  ].join("\n");
  await sendTelegramMessage(text);
}

/** Notify the bot when an order is deleted (admin action). */
export async function sendOrderDeletedToTelegram(order: OrderDoc): Promise<void> {
  const text = [
    "🗑️ <b>ĐƠN HÀNG ĐÃ BỊ XÓA</b>",
    `Mã: ${order._id}`,
    `Khách: ${order.customerName}`,
    `SĐT: ${order.customerPhone}`,
    `Trạng thái: ${ORDER_STATUS_LABELS[order.status]}`,
    `Tổng tiền: ${formatVnd(order.total)}`,
  ].join("\n");
  await sendTelegramMessage(text);
}
