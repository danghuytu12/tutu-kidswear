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
