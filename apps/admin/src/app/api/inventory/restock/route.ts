import { NextResponse } from "next/server";
import { restockVariant } from "@repo/ui/lib/db/repositories/inventory";
import { requireSession } from "@/lib/require-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Nhập kho: add units to one variant.
 * Body: { productId, color, size, qty (> 0), costPrice?, note? }.
 */
export async function POST(request: Request) {
  const denied = await requireSession(request);
  if (denied) return denied;

  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const { productId, color, size, note } = body;
    const qty = Math.floor(Number(body.qty));
    const costPrice =
      body.costPrice === undefined || body.costPrice === ""
        ? undefined
        : Math.max(0, Math.floor(Number(body.costPrice)));
    if (
      typeof productId !== "string" ||
      typeof color !== "string" ||
      typeof size !== "string" ||
      !Number.isFinite(qty) ||
      qty <= 0 ||
      (costPrice !== undefined && !Number.isFinite(costPrice))
    ) {
      return NextResponse.json(
        { error: "Số lượng nhập phải lớn hơn 0" },
        { status: 400 },
      );
    }
    const result = await restockVariant({
      productId,
      color,
      size,
      qty,
      costPrice,
      note: typeof note === "string" ? note.trim() || undefined : undefined,
    });
    if (!result.ok) {
      return NextResponse.json(
        { error: "Không tìm thấy biến thể này" },
        { status: 404 },
      );
    }
    return NextResponse.json({ stockAfter: result.stockAfter });
  } catch {
    return NextResponse.json({ error: "Không thể nhập kho" }, { status: 500 });
  }
}
