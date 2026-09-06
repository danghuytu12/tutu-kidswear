import { NextResponse } from "next/server";
import { markOrderRead } from "@repo/ui/lib/db/repositories/orders";
import { requireSession } from "@/lib/require-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireSession(request);
  if (denied) return denied;

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
