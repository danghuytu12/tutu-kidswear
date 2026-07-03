// packages/ui/src/lib/notify/telegram.ts
// Server-only: sends an order summary to a Telegram bot. Best-effort — reads
// creds from env, catches/logs all errors, never throws.
import type { OrderDoc } from "../db/types";
import { formatVnd } from "../cart";

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
        body: JSON.stringify({
          chat_id: chatId,
          text: buildMessage(order),
          parse_mode: "HTML",
        }),
      },
    );
    if (!res.ok) {
      console.error("[telegram] sendMessage failed", res.status, await res.text());
    }
  } catch (err) {
    console.error("[telegram] request error", err);
  }
}
