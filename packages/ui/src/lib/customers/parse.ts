// Reads a customer spreadsheet into a grid of raw cells.
// Server-only: exceljs pulls in Node streams.

import ExcelJS from "exceljs";
import type { RawCell } from "../shopee/normalize";

export interface CustomerSheetGrid {
  /** Row 1, as text. Index = 0-based column index. */
  headers: string[];
  /** Rows 2+, each padded to headers.length. */
  rows: RawCell[][];
}

/** Flatten the wrappers exceljs uses for formulas, rich text and hyperlinks. */
function cellText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    const v = value as Record<string, unknown>;
    if ("result" in v) return cellText(v.result);
    if ("richText" in v && Array.isArray(v.richText)) {
      return v.richText.map((r) => String((r as { text?: string }).text ?? "")).join("");
    }
    if ("text" in v) return String(v.text ?? "");
    if ("error" in v) return "";
  }
  return String(value).trim();
}

function toRawCell(value: unknown): RawCell {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value;
  if (typeof value === "number" || typeof value === "string") return value;
  return cellText(value);
}

/**
 * Parse an .xlsx buffer into the first sheet's cells.
 *
 * The sheet is taken by POSITION, unlike the Shopee importer which looks one up
 * by name: this file comes from our own template but people rename the tab, so
 * its name is not something to depend on.
 */
export async function parseCustomerSheet(
  buffer: Buffer,
): Promise<CustomerSheetGrid> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as unknown as ArrayBuffer);

  const ws = wb.worksheets[0];
  if (!ws) throw new Error("Tệp không có sheet nào.");

  const headerRow = ws.getRow(1);
  const width = Math.max(ws.columnCount, headerRow.cellCount);
  if (width === 0) throw new Error("Tệp không có dữ liệu (sheet rỗng).");

  const headers: string[] = [];
  for (let c = 1; c <= width; c++) {
    headers.push(cellText(headerRow.getCell(c).value));
  }

  const rows: RawCell[][] = [];
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
