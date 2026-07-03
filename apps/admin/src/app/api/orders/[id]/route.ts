import { NextResponse } from "next/server";
import { updateOrderStatus } from "@repo/ui/lib/db/repositories/orders";
import { ORDER_STATUSES, type OrderDoc } from "@repo/ui/lib/db/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isValidStatus(v: unknown): v is OrderDoc["status"] {
  return typeof v === "string" && (ORDER_STATUSES as readonly string[]).includes(v);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as { status?: unknown };
    if (!isValidStatus(body.status)) {
      return NextResponse.json(
        { error: "Trạng thái không hợp lệ" },
        { status: 400 },
      );
    }
    const order = await updateOrderStatus(id, body.status);
    if (!order) {
      return NextResponse.json(
        { error: "Không tìm thấy đơn hàng" },
        { status: 404 },
      );
    }
    return NextResponse.json({ order });
  } catch {
    return NextResponse.json(
      { error: "Không thể cập nhật đơn hàng" },
      { status: 500 },
    );
  }
}
