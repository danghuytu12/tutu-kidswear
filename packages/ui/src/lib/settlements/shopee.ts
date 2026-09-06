// Reads Shopee's income report ("Tài chính → Doanh thu") into normalised rows.
//
// Bound by HEADER NAME, unlike the order importer next door which binds by
// column position. That importer's reasoning does not transfer: it binds by
// position because two of its columns differ only in the capitalisation of one
// word, so a name match could silently pick the wrong one. The income report has
// no such collision, and its column set varies with the shop's features
// (campaigns, affiliate, vouchers), so a fixed position would break on a shop
// whose report is one column wider.
//
// Buyer identity is not read here, matching the policy on the order importer:
// this feature reports money, so it stores no personal data.

import { parseMoney, parseText, normalizeOrderDate } from "../shopee/normalize";
import { headerKey } from "../customers/columns";
import type { SheetGrid } from "./parse";
import { feeMagnitude, type SignSample } from "./sign";
import type { MapSettlementResult, ParsedSettlementRow } from "./types";

/**
 * Header fragments per field, folded and matched as substrings.
 *
 * Substrings rather than exact equality because Shopee suffixes headers with
 * units and rates that vary by shop ("Phí Dịch Vụ (bao gồm VAT)"). Order within
 * each list matters: the first fragment that matches a header wins, so the more
 * specific wording is listed first.
 */
const FIELDS = {
  orderCode: ["ma don hang", "order id", "ma dat hang"],
  settledDate: ["ngay doi soat", "thoi gian doi soat", "ngay thanh toan", "settlement date"],
  status: ["trang thai don hang", "trang thai"],
  grossRevenue: [
    "tong so tien nguoi mua thanh toan",
    "tong tien nguoi mua tra",
    "tong gia tri don hang",
  ],
  netAmount: ["tien ky quy", "so tien thuc nhan", "escrow"],
} as const;

/**
 * Fee columns, and the Vietnamese label each is reported under.
 *
 * Every fee found is summed into `platformFee` and listed in `feeBreakdown`, so
 * a shop whose report carries a fee we have not listed loses that fee from the
 * breakdown — but never from `netAmount`, which is read from the file's own
 * escrow column rather than derived. That is the point of trusting escrow: an
 * unrecognised fee makes the breakdown incomplete, not the payout wrong.
 */
const FEE_FIELDS: { fragment: string; label: string; shipping?: boolean }[] = [
  { fragment: "phi co dinh", label: "Phí cố định" },
  { fragment: "phi dich vu", label: "Phí dịch vụ" },
  { fragment: "phi xu ly giao dich", label: "Phí xử lý giao dịch" },
  { fragment: "phi thanh toan", label: "Phí thanh toán" },
  { fragment: "phi hoa hong", label: "Phí hoa hồng" },
  { fragment: "phi van chuyen", label: "Phí vận chuyển", shipping: true },
];

interface Bindings {
  orderCode: number;
  settledDate: number;
  status: number;
  grossRevenue: number;
  netAmount: number;
  fees: { index: number; label: string; shipping: boolean }[];
}

/** Locate each field's column. Throws naming what is missing. */
export function bindShopeeColumns(headers: string[]): Bindings {
  const folded = headers.map((h) => headerKey(h));
  const find = (fragments: readonly string[]): number => {
    for (const f of fragments) {
      const i = folded.findIndex((h) => h.length > 0 && h.includes(f));
      if (i >= 0) return i;
    }
    return -1;
  };

  const orderCode = find(FIELDS.orderCode);
  const settledDate = find(FIELDS.settledDate);
  const grossRevenue = find(FIELDS.grossRevenue);
  const netAmount = find(FIELDS.netAmount);

  const missing: string[] = [];
  if (orderCode < 0) missing.push("Mã đơn hàng");
  if (settledDate < 0) missing.push("Ngày đối soát");
  if (grossRevenue < 0) missing.push("Tổng số tiền người mua thanh toán");
  if (netAmount < 0) missing.push("Tiền ký quỹ");
  if (missing.length > 0) {
    throw new Error(
      `Tệp Shopee thiếu cột bắt buộc: ${missing.map((m) => `"${m}"`).join(", ")}. ` +
        "Hãy tải báo cáo ở Tài chính → Doanh thu (không phải Đơn hàng → Xuất).",
    );
  }

  const fees: Bindings["fees"] = [];
  const claimed = new Set<number>([orderCode, settledDate, grossRevenue, netAmount]);
  for (const spec of FEE_FIELDS) {
    folded.forEach((h, i) => {
      // A column is claimed once: without this, "phi van chuyen" also matches
      // "phi van chuyen tra hang" and the same money is counted twice.
      if (claimed.has(i) || h.length === 0 || !h.includes(spec.fragment)) return;
      claimed.add(i);
      fees.push({ index: i, label: spec.label, shipping: spec.shipping ?? false });
    });
  }

  return { orderCode, settledDate, status: find(FIELDS.status), grossRevenue, netAmount, fees };
}

/** Money as written, signs untouched — what the sign detector reconciles against. */
export function shopeeSignSamples(grid: SheetGrid, b: Bindings): SignSample[] {
  return grid.rows.map((row) => ({
    grossRevenue: parseMoney(row[b.grossRevenue]),
    rawFees: b.fees.map((f) => parseMoney(row[f.index])),
    netAmount: parseMoney(row[b.netAmount]),
  }));
}

/**
 * Map the sheet into normalised rows.
 *
 * Takes no sign argument: fees are stored as magnitudes, so whichever way the
 * file signs them the stored value is the same. The detected sign matters to the
 * caller — it must run the reconciliation check before trusting the file at all
 * — but not to this mapping.
 *
 * Rows without an order code or a readable date are dropped and counted rather
 * than defaulted: an unreadable date would land the money in the wrong period,
 * and a blank code would collide with every other blank under the upsert key.
 */
export function mapShopeeSettlement(
  grid: SheetGrid,
  b: Bindings = bindShopeeColumns(grid.headers),
): MapSettlementResult {
  const byCode = new Map<string, ParsedSettlementRow>();
  let skippedNoCode = 0;
  let skippedNoDate = 0;
  let duplicateInFile = 0;

  for (const row of grid.rows) {
    const orderCode = parseText(row[b.orderCode]);
    if (!orderCode) {
      skippedNoCode++;
      continue;
    }
    const settledDateRaw = parseText(row[b.settledDate]);
    const settledDayKey = normalizeOrderDate(row[b.settledDate]);
    if (!settledDayKey) {
      skippedNoDate++;
      continue;
    }

    const feeBreakdown: Record<string, number> = {};
    let platformFee = 0;
    let shippingFee = 0;
    for (const f of b.fees) {
      const amount = feeMagnitude(parseMoney(row[f.index]));
      if (amount === 0) continue;
      feeBreakdown[f.label] = (feeBreakdown[f.label] ?? 0) + amount;
      if (f.shipping) shippingFee += amount;
      else platformFee += amount;
    }

    const parsed: ParsedSettlementRow = {
      source: "shopee",
      orderCode,
      settledDayKey,
      settledDateRaw,
      grossRevenue: parseMoney(row[b.grossRevenue]),
      platformFee,
      shippingFee,
      netAmount: parseMoney(row[b.netAmount]),
      feeBreakdown,
      status: b.status >= 0 ? parseText(row[b.status]) : "",
    };

    // Shopee lists an order once per settlement, but a report that spans a
    // correction can repeat one. The later row is the corrected figure.
    if (byCode.has(orderCode)) duplicateInFile++;
    byCode.set(orderCode, parsed);
  }

  return { rows: [...byCode.values()], skippedNoCode, skippedNoDate, duplicateInFile };
}
