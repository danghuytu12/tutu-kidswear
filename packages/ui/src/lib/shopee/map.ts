// Turns a parsed sheet grid into the rows we store, counting everything it
// had to discard so the import result can surface problems immediately.

import { resolveColumns } from "./columns";
import { normalizeOrderDate, parseCount, parseMoney, parseText } from "./normalize";
import type { SheetGrid } from "./parse";

/** One stored line-item row, before the DB stamps ids onto it. */
export interface ParsedShopeeRow {
  orderCode: string;
  orderDayKey: string;
  orderDateRaw: string;
  status: string;
  productName: string;
  variantName: string;
  unitPrice: number;
  quantity: number;
  buyerPaidTotal: number;
  orderValue: number;
}

export interface MapShopeeResult {
  rows: ParsedShopeeRow[];
  /** Rows dropped because the order code was blank (trailing blanks, mostly). */
  skippedNoCode: number;
  /** Rows dropped because the order date could not be read — see normalizeOrderDate. */
  unparsedDateCount: number;
}

/**
 * Map a sheet grid to storable rows.
 *
 * One document per spreadsheet row: the export is per line-item, so an order
 * with three products yields three rows that all repeat the order-level money
 * columns. Nothing is grouped here — keeping the import a lossless transform
 * means a misreading can be fixed in a query later instead of by re-importing.
 *
 * Throws when the header row is not a Shopee export (see resolveColumns).
 */
export function mapShopeeRows(grid: SheetGrid): MapShopeeResult {
  const cols = resolveColumns(grid.headers);
  const rows: ParsedShopeeRow[] = [];
  let skippedNoCode = 0;
  let unparsedDateCount = 0;

  for (const cells of grid.rows) {
    const orderCode = parseText(cells[cols.orderCode]);
    if (!orderCode) {
      skippedNoCode++;
      continue;
    }

    const orderDateRaw = parseText(cells[cols.orderDate]);
    const orderDayKey = normalizeOrderDate(cells[cols.orderDate]);
    if (!orderDayKey) {
      unparsedDateCount++;
      continue;
    }

    rows.push({
      orderCode,
      orderDayKey,
      orderDateRaw,
      status: parseText(cells[cols.status]),
      productName: parseText(cells[cols.productName]),
      variantName: parseText(cells[cols.variantName]),
      unitPrice: parseMoney(cells[cols.unitPrice]),
      quantity: parseCount(cells[cols.quantity]),
      buyerPaidTotal: parseMoney(cells[cols.buyerPaidTotal]),
      orderValue: parseMoney(cells[cols.orderValue]),
    });
  }

  return { rows, skippedNoCode, unparsedDateCount };
}
