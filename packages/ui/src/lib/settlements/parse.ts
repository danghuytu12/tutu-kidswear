// Reads a settlement .xlsx into a grid of raw cells.
// Server-only: exceljs pulls in Node streams.
//
// Deliberately more forgiving than the Shopee order importer, which knows its
// sheet is called "orders" and its headers sit on row 1. Three platforms export
// three different shapes here — TikTok ships several sheets including a "Fees
// explanation" tab, and some exports carry a title block above the real header
// row — so the sheet and the header row are both located by looking, not by
// assuming. What stays strict is the column binding itself: once the header row
// is found, each source asserts the headers it expects and refuses a file that
// does not match.

import ExcelJS from "exceljs";
import type { RawCell } from "../shopee/normalize";

export interface SheetGrid {
  /** The sheet these cells came from, for error messages. */
  sheetName: string;
  /** The header row, as text. Index = 0-based column index. */
  headers: string[];
  /** Every row below the header, padded to headers.length. */
  rows: RawCell[][];
  /** 1-based row number the headers were found on. */
  headerRowNumber: number;
}

/**
 * How far down to hunt for the header row.
 *
 * Exports that carry a title block put the headers a few rows down; nothing
 * legitimate buries them deeper than this, and a wider search starts matching
 * data rows that happen to contain text.
 */
const MAX_HEADER_SCAN_ROWS = 15;

/** A header row has to carry at least this many non-empty cells to count. */
const MIN_HEADER_CELLS = 3;

/**
 * Read every sheet in the workbook.
 *
 * All sheets are returned rather than one guessed sheet: which one holds the
 * settlement data differs per platform, so the caller decides by inspecting the
 * headers. Sheets too small to hold a header row are dropped here.
 */
export async function parseSettlementWorkbook(buffer: Buffer): Promise<SheetGrid[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as unknown as ArrayBuffer);

  if (wb.worksheets.length === 0) {
    throw new Error("Tệp không có sheet nào.");
  }

  const grids: SheetGrid[] = [];
  for (const ws of wb.worksheets) {
    const grid = readSheet(ws);
    if (grid) grids.push(grid);
  }

  if (grids.length === 0) {
    const names = wb.worksheets.map((s) => `"${s.name}"`).join(", ");
    throw new Error(`Không sheet nào trong tệp có dữ liệu (đã kiểm tra: ${names}).`);
  }
  return grids;
}

function readSheet(ws: ExcelJS.Worksheet): SheetGrid | null {
  const width = Math.max(ws.columnCount, 0);
  if (width === 0 || ws.rowCount === 0) return null;

  const headerRowNumber = findHeaderRow(ws, width);
  if (headerRowNumber === 0) return null;

  const headerRow = ws.getRow(headerRowNumber);
  const headers: string[] = [];
  for (let c = 1; c <= width; c++) {
    headers.push(cellText(headerRow.getCell(c).value));
  }

  const rows: RawCell[][] = [];
  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber <= headerRowNumber) return;
    const cells: RawCell[] = [];
    for (let c = 1; c <= width; c++) {
      cells.push(toRawCell(row.getCell(c).value));
    }
    // A row of entirely blank cells carries no data; exceljs counts a row as
    // non-empty if it has any styling, so trailing formatted rows show up here.
    if (cells.some((v) => v !== "" && v !== null && v !== undefined)) rows.push(cells);
  });

  return { sheetName: ws.name, headers, rows, headerRowNumber };
}

/** First row within the scan window carrying enough text cells. Returns 0 if none. */
function findHeaderRow(ws: ExcelJS.Worksheet, width: number): number {
  const limit = Math.min(ws.rowCount, MAX_HEADER_SCAN_ROWS);
  for (let r = 1; r <= limit; r++) {
    const row = ws.getRow(r);
    let filled = 0;
    for (let c = 1; c <= width; c++) {
      if (cellText(row.getCell(c).value) !== "") filled++;
    }
    if (filled >= MIN_HEADER_CELLS) return r;
  }
  return 0;
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
    if ("richText" in value) return value.richText.map((r) => r.text).join("");
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
