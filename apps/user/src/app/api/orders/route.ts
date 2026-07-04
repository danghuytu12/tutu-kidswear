import { NextResponse } from "next/server";
import { createOrder } from "@repo/ui/lib/db/repositories/orders";
import { sendOrderToTelegram } from "@repo/ui/lib/notify/telegram";
import type { OrderInput } from "@repo/ui/lib/db/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as OrderInput;
    if (
      !body.items?.length ||
      !body.customerName ||
      !body.customerPhone ||
      !body.address
    ) {
      return NextResponse.json(
        { error: "Thiếu thông tin đơn hàng bắt buộc" },
        { status: 400 },
      );
    }
    // QR orders must carry a bank-transfer receipt image.
    if (body.paymentMethod === "qr" && !body.paymentProof) {
      return NextResponse.json(
        { error: "Thiếu ảnh biên lai chuyển khoản" },
        { status: 400 },
      );
    }
    // 1. Save to Mongo first — this is the admin feed.
    const order = await createOrder(body);
    // 2. Notify Telegram (best-effort; never blocks or fails the response).
    try {
      await sendOrderToTelegram(order);
    } catch (err) {
      console.error("[orders] telegram notify failed", err);
    }
    return NextResponse.json({ order }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Không thể tạo đơn hàng" },
      { status: 500 },
    );
  }
}
