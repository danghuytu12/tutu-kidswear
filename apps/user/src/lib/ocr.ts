// Client-only OCR helper: read a bank-transfer receipt image and pull out every
// number that could be an amount, so the checkout can check whether the amount
// the customer transferred matches their order total.
//
// Tesseract on real receipts is imperfect (fonts, glare, skew), so we cast a
// wide net: extract ALL digit groups, normalise away thousands separators, and
// let the caller check whether any of them equals the order total.
import Tesseract from "tesseract.js";

/**
 * Extract candidate integer amounts from receipt image text. Matches digit runs
 * that may include "." / "," / space as thousands separators (e.g. "545.233",
 * "545 233", "545,233") and normalises each to a plain integer (545233).
 * Groups shorter than 4 digits are dropped — order totals are always ≥ 1.000đ,
 * and short numbers (dates, reference digits) create false positives.
 */
export function extractAmounts(text: string): number[] {
  const out = new Set<number>();
  // A digit, then any run of digits/separators — captures grouped numbers.
  const re = /\d[\d.,\s]*\d|\d/g;
  for (const raw of text.match(re) ?? []) {
    const digits = raw.replace(/[^\d]/g, "");
    if (digits.length < 4) continue; // ignore short numbers (noise)
    const n = Number.parseInt(digits, 10);
    if (Number.isFinite(n) && n > 0) out.add(n);
  }
  return [...out];
}

/** True when any extracted amount equals the target order total exactly. */
export function matchesAmount(amounts: number[], target: number): boolean {
  return amounts.includes(target);
}

/**
 * Run OCR on an image File and return the candidate amounts found. Uses English
 * traineddata — receipts are digit-heavy, and "eng" ships the digit glyphs we
 * need without pulling a larger language pack.
 */
export async function readAmountsFromImage(file: File): Promise<number[]> {
  const {
    data: { text },
  } = await Tesseract.recognize(file, "eng");
  return extractAmounts(text);
}
