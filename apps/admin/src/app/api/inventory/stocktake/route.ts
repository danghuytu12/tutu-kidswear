import { NextResponse } from "next/server";
import { setVariantStock } from "@repo/ui/lib/db/repositories/inventory";
import { requireSession } from "@/lib/require-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CountLine = { color: string; size: string; count: number };

function parseCounts(value: unknown): CountLine[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const lines: CountLine[] = [];
  for (const raw of value) {
    const line = raw as Record<string, unknown>;
    const count = Math.floor(Number(line.count));
    if (
      typeof line.color !== "string" ||
      typeof line.size !== "string" ||
      !Number.isFinite(count) ||
      count < 0
    ) {
      return null;
    }
    lines.push({ color: line.color, size: line.size, count });
  }
  return lines;
}

/**
 * Kiểm kê: set the counted quantity for several variants of one product.
 * Body: { productId, counts: [{ color, size, count (>= 0) }], note? }.
 * Lines are applied independently; the response lists any that failed.
 */
export async function POST(request: Request) {
  const denied = await requireSession(request);
  if (denied) return denied;

  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const counts = parseCounts(body.counts);
    if (typeof body.productId !== "string" || !counts) {
      return NextResponse.json(
        { error: "Số lượng kiểm kê không hợp lệ" },
        { status: 400 },
      );
    }
    const note = typeof body.note === "string" ? body.note.trim() || undefined : undefined;

    let changed = 0;
    const failed: string[] = [];
    for (const line of counts) {
      const res = await setVariantStock({ productId: body.productId, ...line, note });
      if (!res.ok) failed.push([line.color, line.size].filter(Boolean).join(" · "));
      else if (res.changed) changed++;
    }
    if (failed.length > 0) {
      return NextResponse.json(
        {
          error: `Chưa cập nhật được: ${failed.join(", ")}. Tồn kho vừa thay đổi, vui lòng thử lại.`,
          changed,
        },
        { status: 409 },
      );
    }
    return NextResponse.json({ changed });
  } catch {
    return NextResponse.json({ error: "Không thể lưu kiểm kê" }, { status: 500 });
  }
}
