import { NextResponse } from "next/server";
import {
  listCustomers,
  importCustomers,
} from "@repo/ui/lib/db/repositories/customers";
import { parseCustomerSheet } from "@repo/ui/lib/customers/parse";
import { mapCustomerRows } from "@repo/ui/lib/customers/map";
import { requireSession } from "@/lib/require-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Upload ceiling. Vercel rejects request bodies over 4.5MB at the platform
 * level before a handler runs, so we stop just under that to return a readable
 * Vietnamese message instead of an opaque 413.
 */
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export async function GET(request: Request) {
  // Customer records carry phone numbers and addresses — never public.
  const denied = await requireSession(request);
  if (denied) return denied;

  try {
    const customers = await listCustomers();
    return NextResponse.json({ customers });
  } catch {
    return NextResponse.json(
      { error: "Failed to load customers" },
      { status: 500 },
    );
  }
}

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

    const buffer = Buffer.from(await file.arrayBuffer());

    // A malformed workbook or a missing required column is the client's
    // problem, so those surface as 400 with the parser's own message.
    let mapped;
    try {
      const grid = await parseCustomerSheet(buffer);
      mapped = mapCustomerRows(grid);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Không đọc được tệp Excel.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    if (mapped.rows.length === 0) {
      return NextResponse.json(
        { error: "Tệp không có dòng khách hàng nào hợp lệ." },
        { status: 400 },
      );
    }

    const result = await importCustomers(mapped.rows);

    return NextResponse.json(
      {
        ...result,
        rowCount: mapped.rows.length,
        skippedNoName: mapped.skippedNoName,
        skippedNoPhone: mapped.skippedNoPhone,
        duplicateInFile: mapped.duplicateInFile,
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Không thể nhập dữ liệu khách hàng." },
      { status: 500 },
    );
  }
}
