import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { createOrder } from "@repo/ui/lib/db/repositories/orders";
import {
  reserveStockForOrder,
  restoreStockForOrder,
} from "@repo/ui/lib/db/repositories/inventory";
import { sendOrderToTelegram } from "@repo/ui/lib/notify/telegram";
import { shortageMessage, type OrderInput } from "@repo/ui/lib/db/types";

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
    // 1. Reserve stock first, all-or-nothing, so an order can never be placed
    //    for units that don't exist. Variants nobody has stocked yet are
    //    skipped and sell as before. The id is chosen up front so the stock
    //    ledger rows point at this order.
    const id = new ObjectId();
    const reserved = await reserveStockForOrder(body.items, id.toHexString());
    if (!reserved.ok) {
      return NextResponse.json(
        { error: shortageMessage(reserved.shortages), shortages: reserved.shortages },
        { status: 409 },
      );
    }
    // 2. Save to Mongo — this is the admin feed. If that fails, hand the
    //    reserved units back so they aren't lost.
    let order;
    try {
      order = await createOrder(body, id);
    } catch (err) {
      await restoreStockForOrder(body.items, id.toHexString(), "cancel");
      throw err;
    }
    // 3. Notify Telegram (best-effort; never blocks or fails the response).
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
