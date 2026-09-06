// The shape every settlement source is normalised into, and the vocabulary the
// rest of the feature speaks.
//
// Three platforms export three unrelated file formats. Rather than teach the
// repository, the aggregation queries and the UI about each one, every parser
// reduces its file to `ParsedSettlementRow` and nothing downstream needs to know
// which platform a row came from.

/**
 * Which export a file came from.
 *
 * SPX is split in two because the shipper issues two unrelated statements: one
 * for COD it collected on our behalf (money in) and one for the carriage it
 * charges us (money out). Treating them as one source would net a receipt
 * against a cost and hide both.
 */
export type SettlementSource = "shopee" | "tiktok" | "spx-cod" | "spx-fee";

/** Vietnamese label for a source, for UI and error messages. */
export const SOURCE_LABELS: Record<SettlementSource, string> = {
  shopee: "Shopee",
  tiktok: "TikTok Shop",
  "spx-cod": "SPX (thu hộ COD)",
  "spx-fee": "SPX (cước vận chuyển)",
};

/**
 * One settled order, normalised.
 *
 * `netAmount` is the number this whole feature exists to report: what the
 * platform actually transferred. It is read from the file's own net column
 * (Shopee's "Tiền ký quỹ", TikTok's "Settlement amount"), never recomputed as
 * revenue minus fees — those net columns are already net of every deduction, so
 * subtracting the fees again would double-count them. The fee fields are for
 * showing where the money went, and must not be used to derive `netAmount`.
 *
 * Fees are stored as POSITIVE magnitudes regardless of how the file wrote them.
 * The sources disagree on sign, and pushing that disagreement past the parser
 * means every later sum has to remember which platform it is looking at.
 */
export interface ParsedSettlementRow {
  source: SettlementSource;
  /** Platform order code. Unique within a source; the upsert key. */
  orderCode: string;
  /** Settlement date as a Vietnam-time YYYY-MM-DD key. */
  settledDayKey: string;
  /** Settlement date verbatim, so a misread date stays traceable. */
  settledDateRaw: string;
  /** What the buyer paid, before the platform's deductions. */
  grossRevenue: number;
  /** Commission, transaction and service fees, summed. Always ≥ 0. */
  platformFee: number;
  /** Shipping borne by the shop. Always ≥ 0. */
  shippingFee: number;
  /** Money actually received. Read from the file, never derived. */
  netAmount: number;
  /** Individual fees keyed by Vietnamese label, for the breakdown table. Always ≥ 0. */
  feeBreakdown: Record<string, number>;
  /** Order status verbatim. */
  status: string;
}

/** What a parser reports back: the rows it understood, and what it could not. */
export interface MapSettlementResult {
  rows: ParsedSettlementRow[];
  /** Rows dropped for having no order code. */
  skippedNoCode: number;
  /** Rows dropped for an unreadable settlement date. */
  skippedNoDate: number;
  /** Order codes appearing more than once in the file; the last occurrence wins. */
  duplicateInFile: number;
}
