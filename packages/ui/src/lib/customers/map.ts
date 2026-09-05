// Turns a parsed customer sheet into storable rows, counting everything it had
// to discard so the import result can surface problems immediately.

import { parseText } from "../shopee/normalize";
import type { CustomerInput } from "../db/types";
import { resolveCustomerColumns, type CustomerColumnIndexes } from "./columns";
import type { CustomerSheetGrid } from "./parse";

export interface MapCustomersResult {
  rows: CustomerInput[];
  /** Rows dropped for having no name. */
  skippedNoName: number;
  /** Rows dropped for having no usable phone number. */
  skippedNoPhone: number;
  /** Rows whose phone repeated an earlier row in the same file; last one wins. */
  duplicateInFile: number;
}

/**
 * Reduce a phone number to the digits we key on.
 *
 * Spreadsheets carry the same number a dozen ways — "0901 234 567",
 * "090.123.4567", "+84901234567", or as a number that lost its leading zero to
 * Excel. All of those must collapse to one key or re-importing the same file
 * would create duplicates instead of updating.
 */
export function normalizePhone(raw: string): string {
  let digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("+84")) digits = `0${digits.slice(3)}`;
  else if (digits.startsWith("84") && digits.length >= 11) digits = `0${digits.slice(2)}`;
  digits = digits.replace(/\D/g, "");
  // Excel stores an unformatted phone as a number and drops the leading zero.
  if (digits.length === 9 && !digits.startsWith("0")) digits = `0${digits}`;
  return digits;
}

/** Read one optional column, or "" when the file omits it. */
function cell(
  cells: unknown[],
  cols: CustomerColumnIndexes,
  field: keyof CustomerColumnIndexes,
): string {
  const idx = cols[field];
  if (idx === undefined) return "";
  return parseText(cells[idx] as never);
}

/**
 * Map a sheet grid to storable customers.
 *
 * Rows missing a name or a phone are counted and dropped rather than stored
 * with a placeholder: phone is the merge key, so a blank one would collapse
 * every such row into a single bogus customer.
 *
 * Throws when required columns are absent (see resolveCustomerColumns).
 */
export function mapCustomerRows(grid: CustomerSheetGrid): MapCustomersResult {
  const cols = resolveCustomerColumns(grid.headers);
  const byPhone = new Map<string, CustomerInput>();
  let skippedNoName = 0;
  let skippedNoPhone = 0;
  let duplicateInFile = 0;

  for (const cells of grid.rows) {
    const name = cell(cells, cols, "name");
    if (!name) {
      skippedNoName++;
      continue;
    }

    const phone = normalizePhone(cell(cells, cols, "phone"));
    if (!phone) {
      skippedNoPhone++;
      continue;
    }

    if (byPhone.has(phone)) duplicateInFile++;

    // Only non-empty values are carried through, so a sparse row never blanks
    // out a field the stored record already has (see importCustomers).
    const row: CustomerInput = { name, phone };
    for (const field of ["email", "address", "ward", "district", "province", "note", "source"] as const) {
      const value = cell(cells, cols, field);
      if (value) row[field] = value;
    }
    byPhone.set(phone, row);
  }

  return {
    rows: [...byPhone.values()],
    skippedNoName,
    skippedNoPhone,
    duplicateInFile,
  };
}
