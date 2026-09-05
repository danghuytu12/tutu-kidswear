// Cell normalizers for the Shopee importer.
//
// The sample export we designed against contains only a header row, so the real
// data cells' types are unverified: money may arrive as a number or as a
// formatted string, dates as a Date, an ISO string, a Vietnamese d/m/Y string,
// or an Excel serial. Everything here accepts all of those shapes and — where a
// value cannot be understood — returns a blank that the caller counts and
// reports, rather than a plausible-looking default that would hide the problem.

import { vnDayKey } from "../date/vn";

/** Excel's day 0. 1899-12-30 rather than 12-31 absorbs the Lotus 1900 leap-year bug. */
const EXCEL_EPOCH_MS = Date.UTC(1899, 11, 30);

/** Serials outside this window are not plausible dates (guards numeric order codes). */
const MIN_EXCEL_SERIAL = 1;
const MAX_EXCEL_SERIAL = 100_000;

/** A cell as exceljs may hand it to us. */
export type RawCell = string | number | Date | null | undefined;

function cellToString(raw: RawCell): string {
  if (raw === null || raw === undefined) return "";
  if (raw instanceof Date) return raw.toISOString();
  return String(raw).trim();
}

/** Text of a cell, trimmed. Empty string when the cell is blank. */
export function parseText(raw: RawCell): string {
  return cellToString(raw);
}

/**
 * Parse a money cell to whole VND.
 *
 * Handles a plain number (1234567), a Vietnamese-formatted string
 * ("1.234.567" / "1.234.567 ₫") and an English-formatted one ("1,234,567.00").
 * The separators are ambiguous — "1.234" is 1234 in VN and 1.234 in en — so the
 * rightmost separator is treated as a decimal point only when it is the sole
 * occurrence of that character AND is followed by one or two digits; otherwise
 * both characters are grouping separators. Unparseable input yields 0.
 */
export function parseMoney(raw: RawCell): number {
  if (typeof raw === "number") {
    return Number.isFinite(raw) ? Math.round(raw) : 0;
  }
  const s = cellToString(raw).replace(/[^\d.,-]/g, "");
  if (!s) return 0;

  const lastDot = s.lastIndexOf(".");
  const lastComma = s.lastIndexOf(",");
  let decimalAt = -1;
  if (lastDot >= 0 || lastComma >= 0) {
    const candidate = lastDot > lastComma ? "." : ",";
    const at = Math.max(lastDot, lastComma);
    const onlyOccurrence = s.indexOf(candidate) === s.lastIndexOf(candidate);
    const trailing = s.length - at - 1;
    if (onlyOccurrence && trailing >= 1 && trailing <= 2) decimalAt = at;
  }

  const intPart = (decimalAt >= 0 ? s.slice(0, decimalAt) : s).replace(/[.,]/g, "");
  const fracPart = decimalAt >= 0 ? s.slice(decimalAt + 1) : "";
  const n = Number(fracPart ? `${intPart}.${fracPart}` : intPart);
  // VND has no minor unit; round so a "1.234.567,50" style cell stays whole.
  return Number.isFinite(n) ? Math.round(n) : 0;
}

/** Parse an integer count (quantity). Unparseable input yields 0. */
export function parseCount(raw: RawCell): number {
  if (typeof raw === "number") {
    return Number.isFinite(raw) ? Math.round(raw) : 0;
  }
  const s = cellToString(raw).replace(/[^\d-]/g, "");
  const n = Number(s);
  return s && Number.isFinite(n) ? Math.round(n) : 0;
}

/**
 * Normalise an order-date cell to a Vietnam-time YYYY-MM-DD key.
 *
 * Returns "" when no interpretation fits. Callers must skip and count those
 * rows: letting an unreadable date fall through as 1970-01-01 would corrupt
 * both the range filter and the per-day overwrite key, silently.
 */
export function normalizeOrderDate(raw: RawCell): string {
  if (raw instanceof Date) {
    return Number.isNaN(raw.getTime()) ? "" : vnDayKey(raw);
  }

  if (typeof raw === "number") {
    return excelSerialToDayKey(raw);
  }

  const s = cellToString(raw);
  if (!s) return "";

  // An explicit offset means the cell names an absolute instant, so resolve it
  // in Vietnam time: 2026-08-15T18:00:00Z is already 16 August there. Checked
  // before the bare-date branch below, which would otherwise keep the UTC day.
  if (/^\d{4}-\d{2}-\d{2}T[\d:.]+(?:Z|[+-]\d{2}:?\d{2})$/.test(s)) {
    const t = Date.parse(s);
    if (!Number.isNaN(t)) return vnDayKey(new Date(t));
  }

  // A local day key, possibly with a time suffix: "2026-08-15 09:12:00". With
  // no offset the date is already the seller's local day — take it as written.
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  // Vietnamese order, day first: "15/08/2026 14:30".
  const vn = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/.exec(s);
  if (vn) {
    const d = Number(vn[1]);
    const m = Number(vn[2]);
    const y = Number(vn[3]);
    const probe = new Date(Date.UTC(y, m - 1, d));
    if (probe.getUTCMonth() + 1 === m && probe.getUTCDate() === d) {
      return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    }
    return "";
  }

  // A bare number in a date column: an Excel serial.
  if (/^\d+(\.\d+)?$/.test(s)) return excelSerialToDayKey(Number(s));

  // Anything else parseable is an absolute instant — resolve it in VN time,
  // since 2026-08-15T18:00:00Z is already 16 August in Vietnam.
  const parsed = Date.parse(s);
  return Number.isNaN(parsed) ? "" : vnDayKey(new Date(parsed));
}

function excelSerialToDayKey(serial: number): string {
  if (!Number.isFinite(serial)) return "";
  if (serial < MIN_EXCEL_SERIAL || serial > MAX_EXCEL_SERIAL) return "";
  const ms = EXCEL_EPOCH_MS + Math.floor(serial) * 86_400_000;
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
