import { NextResponse } from "next/server";
import {
  importShopeeRows,
  listShopeeImports,
} from "@repo/ui/lib/db/repositories/shopee";
import { parseShopeeFilename } from "@repo/ui/lib/shopee/filename";
import { parseShopeeSheet } from "@repo/ui/lib/shopee/parse";
import { mapShopeeRows } from "@repo/ui/lib/shopee/map";
import { requireSession } from "@/lib/require-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Upload ceiling. Vercel rejects request bodies over 4.5MB at the platform
 * level before a handler runs, so we stop just under that to return a readable
 * Vietnamese message instead of an opaque 413. A 62-column Shopee export runs
 * to a few hundred KB, so this is far above any real file.
 */
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export async function POST(request: Request) {
  const denied = await requireSession(request);
  if (denied) return denied;

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Thiếu tệp tải lên." }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: "Tệp quá lớn (tối đa 4MB)." },
        { status: 413 },
      );
    }

    // Check the name before reading any bytes — a misnamed file costs nothing.
    const parsed = parseShopeeFilename(file.name, new Date());
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // A malformed or non-Shopee workbook is the client's problem, not ours, so
    // parse failures surface as 400 with the parser's own message.
    let mapped;
    try {
      const grid = await parseShopeeSheet(buffer);
      mapped = mapShopeeRows(grid);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Không đọc được tệp Excel.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const result = await importShopeeRows({
      filename: file.name,
      range: parsed.range,
      fileSize: file.size,
      rows: mapped.rows,
    });

    return NextResponse.json(
      {
        ...result,
        range: parsed.range,
        skippedNoCode: mapped.skippedNoCode,
        unparsedDateCount: mapped.unparsedDateCount,
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Không thể nhập dữ liệu Shopee." },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  const denied = await requireSession(request);
  if (denied) return denied;

  try {
    const imports = await listShopeeImports();
    return NextResponse.json({ imports });
  } catch {
    return NextResponse.json(
      { error: "Không thể tải lịch sử nhập." },
      { status: 500 },
    );
  }
}
