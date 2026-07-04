import { NextResponse } from "next/server";
import { markOrderRead } from "@repo/ui/lib/db/repositories/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const ok = await markOrderRead(id);
    if (!ok) {
      return NextResponse.json(
        { error: "Không tìm thấy đơn hàng" },
        { status: 404 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Không thể cập nhật thông báo" },
      { status: 500 },
    );
  }
}
