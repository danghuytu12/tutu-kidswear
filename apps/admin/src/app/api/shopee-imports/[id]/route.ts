import { NextResponse } from "next/server";
import { deleteShopeeImport } from "@repo/ui/lib/db/repositories/shopee";
import { requireSession } from "@/lib/require-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireSession(request);
  if (denied) return denied;

  try {
    const { id } = await params;
    const deleted = await deleteShopeeImport(id);
    if (deleted === null) {
      return NextResponse.json(
        { error: "Không tìm thấy lần nhập này." },
        { status: 404 },
      );
    }
    return NextResponse.json({ ok: true, deleted });
  } catch {
    return NextResponse.json(
      { error: "Không thể xóa lần nhập." },
      { status: 500 },
    );
  }
}
