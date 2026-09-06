// Works out how a settlement file signs its fees, and refuses the file when the
// numbers do not add up.
//
// The temptation is to hardcode "Shopee writes fees as negative" — their docs do
// say so. But a hardcoded sign fails silently: if a file ever arrives with the
// other convention, or a column gets bound to the wrong field, the totals stay
// plausible and nothing complains until the books disagree with the bank weeks
// later. So instead of trusting the documentation, each file is asked to prove
// which convention it uses, against its own net column.
//
// The check doubles as a column-binding test. It only passes if revenue, fees
// and net line up arithmetically, which they cannot do if a fee column was bound
// to the wrong field or the net column was misread.

/** One row's money, as literally read from the file — signs untouched. */
export interface SignSample {
  grossRevenue: number;
  /** Every fee cell as written, sign included. */
  rawFees: number[];
  /** The file's own net/escrow column. */
  netAmount: number;
}

/** How a file writes its fees. */
export type FeeSign = "negative" | "positive";

export interface SignDetection {
  ok: boolean;
  sign: FeeSign;
  /** Share of sampled rows satisfying the winning hypothesis, 0..1. */
  confidence: number;
  /** Rows actually tested (rows with no money at all are not evidence). */
  sampled: number;
  /** Rows carrying no settlement figures at all — orders not yet paid out. */
  unsettledRows: number;
  /** Total rows examined, settled or not. */
  totalRows: number;
  /** Vietnamese explanation, set when `ok` is false. */
  error?: string;
}

/** Rows to test. Enough to be conclusive without walking a 10k-row file. */
const SAMPLE_SIZE = 50;

/**
 * Take `count` rows spread evenly across the list rather than the first `count`.
 *
 * Sampling the head would miss exactly the files this check exists to catch:
 * exports commonly carry ordinary orders first and adjustments, refunds or
 * cancellations at the end, so a head sample reports full confidence on a file
 * whose tail does not reconcile at all.
 */
function spread<T>(items: T[], count: number): T[] {
  if (items.length <= count) return items;
  const step = items.length / count;
  const out: T[] = [];
  for (let i = 0; i < count; i++) out.push(items[Math.floor(i * step)]!);
  return out;
}

/**
 * Rounding slack per row, in VND.
 *
 * Not zero: platforms round each fee component independently, so a row can be a
 * dong or two out through no fault of ours. Deliberately tiny — a real sign
 * error is off by twice the fee, thousands of dong, so this cannot mask one.
 */
const TOLERANCE_VND = 5;

/**
 * Share of rows that must agree before the file is trusted.
 *
 * Below this, something is structurally wrong — the wrong column bound, a mix of
 * conventions, adjustment rows we do not understand — and importing would write
 * numbers nobody can rely on.
 */
const MIN_CONFIDENCE = 0.8;

/**
 * Share of rows that may lack settlement figures before the file is rejected.
 *
 * This is the guard against importing the ORDER export instead of the income
 * report. Both Shopee files carry the same fee columns, so headers cannot tell
 * them apart, and the reconciliation check above cannot either: it ignores rows
 * with no money as carrying no evidence, so an order export whose settled
 * minority reconciles perfectly would pass at full confidence while recording a
 * fraction of the period's money as though it were all of it.
 *
 * An income report contains only settled orders, so a high share of empty rows
 * means the wrong file. Set loosely — a genuine report can hold a few
 * zero-value adjustments — but far below the majority an order export shows.
 */
const MAX_UNSETTLED_SHARE = 0.35;

/**
 * Decide whether fees are negative or positive in this file.
 *
 * Tests both hypotheses against the file's own net column:
 *   fees negative → net ≈ revenue + Σfees
 *   fees positive → net ≈ revenue − Σfees
 * and takes the one more rows agree with.
 */
export function detectFeeSign(samples: SignSample[]): SignDetection {
  // Rows where everything is zero carry no information about sign; counting them
  // as agreement would let an empty file "confirm" any hypothesis.
  const settled = samples.filter((s) => s.rawFees.some((f) => f !== 0) && s.netAmount !== 0);
  const unsettledRows = samples.length - settled.length;
  const totalRows = samples.length;
  const usable = spread(settled, SAMPLE_SIZE);

  if (usable.length === 0) {
    return {
      ok: false,
      sign: "negative",
      confidence: 0,
      sampled: 0,
      unsettledRows,
      totalRows,
      error:
        "Không tìm thấy dòng nào có đủ số tiền và phí để đối chiếu. " +
        "Hãy kiểm tra xem đây có đúng là file đối soát (không phải file đơn hàng) không.",
    };
  }

  // Checked before the sign test, because the sign test cannot see this: it
  // discards unsettled rows as no-evidence, so it would report full confidence
  // on an order export and import a fraction of the period's money as the whole.
  const unsettledShare = totalRows > 0 ? unsettledRows / totalRows : 0;
  if (unsettledShare > MAX_UNSETTLED_SHARE) {
    return {
      ok: false,
      sign: "negative",
      confidence: 0,
      sampled: usable.length,
      unsettledRows,
      totalRows,
      error:
        `${unsettledRows}/${totalRows} dòng (${Math.round(unsettledShare * 100)}%) chưa có số liệu đối soát. ` +
        "Đây gần như chắc chắn là file ĐƠN HÀNG, không phải file ĐỐI SOÁT. " +
        "Với Shopee hãy tải ở Tài chính → Doanh thu. Chưa nhập gì vào hệ thống.",
    };
  }

  let negativeHits = 0;
  let positiveHits = 0;
  for (const s of usable) {
    const feeSum = s.rawFees.reduce((a, b) => a + b, 0);
    if (Math.abs(s.grossRevenue + feeSum - s.netAmount) <= TOLERANCE_VND) negativeHits++;
    if (Math.abs(s.grossRevenue - feeSum - s.netAmount) <= TOLERANCE_VND) positiveHits++;
  }

  const negative = negativeHits >= positiveHits;
  const hits = negative ? negativeHits : positiveHits;
  const confidence = hits / usable.length;

  if (confidence < MIN_CONFIDENCE) {
    return {
      ok: false,
      sign: negative ? "negative" : "positive",
      confidence,
      sampled: usable.length,
      unsettledRows,
      totalRows,
      error:
        `Số tiền trong tệp không khớp: chỉ ${Math.round(confidence * 100)}% số dòng ` +
        `thoả mãn "tiền thực nhận = doanh thu ± phí" (cần ít nhất ${MIN_CONFIDENCE * 100}%). ` +
        "Tệp có thể sai định dạng hoặc thuộc loại báo cáo khác. Chưa nhập gì vào hệ thống.",
    };
  }

  return {
    ok: true,
    sign: negative ? "negative" : "positive",
    confidence,
    sampled: usable.length,
    unsettledRows,
    totalRows,
  };
}

/**
 * A fee as a positive magnitude, given the file's convention.
 *
 * Takes the absolute value rather than negating: a file that mixes signs within
 * a column would otherwise turn a stray opposite-signed cell into a negative
 * "fee" that quietly adds to the payout.
 */
export function feeMagnitude(raw: number): number {
  return Math.abs(raw);
}
