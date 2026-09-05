import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { CUSTOMER_COLUMNS } from "@repo/ui/lib/customers/columns";
import { requireSession } from "@/lib/require-session";

// exceljs needs the Node.js runtime, and the workbook is built per request.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FILENAME = "mau-khach-hang.xlsx";

/** Two obviously-fictional rows showing the expected shape of each column. */
const EXAMPLES = [
  {
    name: "Nguyễn Văn A",
    phone: "0901234567",
    email: "vana@example.com",
    address: "12 Lê Lợi",
    ward: "Phường Bến Nghé",
    district: "Quận 1",
    province: "TP. Hồ Chí Minh",
    note: "Khách quen, thích màu hồng",
    source: "Facebook",
  },
  {
    name: "Trần Thị B",
    phone: "0912345678",
    email: "",
    address: "45 Nguyễn Huệ",
    ward: "Phường Hàng Bài",
    district: "Quận Hoàn Kiếm",
    province: "Hà Nội",
    note: "",
    source: "Shopee",
  },
];

/** Wider for free text, narrower for codes — so nothing needs dragging open. */
const WIDTHS: Record<string, number> = {
  name: 24,
  phone: 16,
  email: 26,
  address: 28,
  ward: 20,
  district: 20,
  province: 20,
  note: 32,
  source: 16,
};

export async function GET(request: Request) {
  const denied = await requireSession(request);
  if (denied) return denied;

  const fields = Object.keys(CUSTOMER_COLUMNS) as (keyof typeof CUSTOMER_COLUMNS)[];

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Khách hàng");

  ws.columns = fields.map((field) => ({
    header: CUSTOMER_COLUMNS[field].header,
    key: field,
    width: WIDTHS[field] ?? 18,
  }));

  const header = ws.getRow(1);
  header.font = { bold: true };
  header.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF2F4F7" },
  };
  header.alignment = { vertical: "middle" };
  header.height = 22;
  ws.views = [{ state: "frozen", ySplit: 1 }];

  // Phone as text: left as a number, Excel eats the leading zero and
  // 0901234567 becomes 901234567 — which then fails to match any order.
  const phoneCol = ws.getColumn(fields.indexOf("phone") + 1);
  phoneCol.numFmt = "@";

  for (const example of EXAMPLES) ws.addRow(example);

  const buffer = await wb.xlsx.writeBuffer();

  return new NextResponse(buffer as ArrayBuffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${FILENAME}"`,
      "Cache-Control": "no-store",
    },
  });
}
