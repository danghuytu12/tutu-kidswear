// Reads the "orders" sheet out of a Shopee .xlsx into a grid of raw cells.
// Server-only: exceljs pulls in Node streams.

import ExcelJS from "exceljs";
import type { RawCell } from "./normalize";

/** Name of the sheet Shopee exports its orders into. */
const SHEET_NAME = "orders";

export interface SheetGrid {
  /** Row 1, as text. Index = 0-based column index. */
  headers: string[];
  /** Rows 2+, each padded to headers.length. */
  rows: RawCell[][];
}

/**
 * Parse an .xlsx buffer into the orders sheet's cells.
 *
 * The sheet is looked up BY NAME: in the real export it is the workbook's
 * second sheet (xl/worksheets/sheet2.xml), so indexing by position would read
 * the wrong one — or nothing at all.
 */
export async function parseShopeeSheet(buffer: Buffer): Promise<SheetGrid> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as unknown as ArrayBuffer);

  const ws = wb.getWorksheet(SHEET_NAME);
  if (!ws) {
    const found = wb.worksheets.map((s) => `"${s.name}"`).join(", ") || "không có sheet nào";
    throw new Error(
      `Không tìm thấy sheet "${SHEET_NAME}" trong tệp. Tệp đang có: ${found}.`,
    );
  }

  const headerRow = ws.getRow(1);
  const width = Math.max(ws.columnCount, headerRow.cellCount);
  if (width === 0) throw new Error("Tệp không có dữ liệu (sheet rỗng).");

  const headers: string[] = [];
  for (let c = 1; c <= width; c++) {
    headers.push(cellText(headerRow.getCell(c).value));
  }

  const rows: RawCell[][] = [];
  // eachRow skips blank rows entirely, so a spreadsheet with gaps still yields
  // a dense array — row numbers are not preserved and are not needed.
  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;
    const cells: RawCell[] = [];
    for (let c = 1; c <= width; c++) {
      cells.push(toRawCell(row.getCell(c).value));
    }
    rows.push(cells);
  });

  return { headers, rows };
}

/**
 * Flatten one exceljs cell value into a primitive we can normalise.
 *
 * exceljs hands back wrapper objects for formulas, hyperlinks and rich text; we
 * want the underlying value in each case, not "[object Object]".
 */
function toRawCell(value: ExcelJS.CellValue): RawCell {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value;
  if (typeof value === "number" || typeof value === "string") return value;
  if (typeof value === "boolean") return String(value);

  if (typeof value === "object") {
    if ("result" in value) return toRawCell(value.result as ExcelJS.CellValue);
    if ("richText" in value) {
      return value.richText.map((r) => r.text).join("");
    }
    if ("text" in value) return String(value.text);
    if ("error" in value) return "";
  }
  return String(value);
}

function cellText(value: ExcelJS.CellValue): string {
  const raw = toRawCell(value);
  if (raw instanceof Date) return raw.toISOString();
  return String(raw ?? "").trim();
}
