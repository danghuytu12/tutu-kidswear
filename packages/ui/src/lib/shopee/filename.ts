// Decodes the date range a Shopee export covers from its filename.
//
// Deliberately free of Node-only imports: the upload component runs this in the
// browser to echo the resolved range back to the admin BEFORE uploading, which
// is the safety net for the year-guessing described below.

import { daysBetween, vnDayKey } from "../date/vn";

/** Strict export filename: shoppe_<day>-<month>_<day>-<month>.xlsx (day first, VN order). */
const FILENAME_RE = /^shoppe_(\d{1,2})-(\d{1,2})_(\d{1,2})-(\d{1,2})\.xlsx$/i;

/** Longest range we accept; anything more means the filename was misread. */
const MAX_RANGE_DAYS = 366;

export interface FilenameRange {
  /** Inclusive YYYY-MM-DD. */
  from: string;
  /** Inclusive YYYY-MM-DD. */
  to: string;
}

export type FilenameParseResult =
  | { ok: true; range: FilenameRange }
  | { ok: false; error: string };

export const FILENAME_FORMAT_ERROR =
  "Tên tệp không hợp lệ. Định dạng bắt buộc: shoppe_<ngày>-<tháng>_<ngày>-<tháng>.xlsx (ví dụ: shoppe_1-8_30-8.xlsx).";

/** Build a YYYY-MM-DD key, or null when that day does not exist in that month. */
function dayKey(year: number, month: number, day: number): string | null {
  const d = new Date(Date.UTC(year, month - 1, day));
  // Date.UTC silently rolls invalid days over (31 Feb → 3 Mar), so verify the
  // parts survived the round-trip rather than trusting the constructor.
  if (d.getUTCMonth() + 1 !== month || d.getUTCDate() !== day) return null;
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

/**
 * Decode `shoppe_1-8_30-8.xlsx` into { from: "2026-08-01", to: "2026-08-30" }.
 *
 * The filename carries no year, so it is inferred from `now` in Vietnam time.
 * A range whose end falls before its start is read as crossing into the next
 * year, and a range that would land wholly in the future is pulled back a year
 * (an early-January upload of December's data). Both inferences are guesses —
 * the upload UI shows the resolved range for confirmation before committing.
 */
export function parseShopeeFilename(
  filename: string,
  now: Date,
): FilenameParseResult {
  const m = FILENAME_RE.exec(filename.trim());
  if (!m) return { ok: false, error: FILENAME_FORMAT_ERROR };

  const [, d1, m1, d2, m2] = m.map(Number) as unknown as [
    unknown,
    number,
    number,
    number,
    number,
  ];

  const todayKey = vnDayKey(now);
  let startYear = Number(todayKey.slice(0, 4));
  // End earlier in the calendar than start means the range spans New Year.
  const crossesYear = m2 < m1 || (m2 === m1 && d2 < d1);
  let endYear = crossesYear ? startYear + 1 : startYear;

  // A range starting well in the future means we guessed the year too high —
  // e.g. uploading shoppe_15-12_10-1.xlsx on 5 Jan means last December.
  const probe = dayKey(startYear, m1, d1);
  if (probe && daysBetween(todayKey, probe) > 31) {
    startYear -= 1;
    endYear -= 1;
  }

  const from = dayKey(startYear, m1, d1);
  if (!from) return { ok: false, error: `Ngày trong tên tệp không hợp lệ: ${d1}-${m1}.` };
  const to = dayKey(endYear, m2, d2);
  if (!to) return { ok: false, error: `Ngày trong tên tệp không hợp lệ: ${d2}-${m2}.` };

  if (daysBetween(from, to) > MAX_RANGE_DAYS) {
    return {
      ok: false,
      error: `Khoảng ngày trong tên tệp quá dài (tối đa ${MAX_RANGE_DAYS} ngày).`,
    };
  }

  return { ok: true, range: { from, to } };
}

/** Render a YYYY-MM-DD key as DD/MM/YYYY for display. */
export function formatDayKey(key: string): string {
  const [y, m, d] = key.split("-");
  return `${d}/${m}/${y}`;
}
