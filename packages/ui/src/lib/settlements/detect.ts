// Works out which platform a settlement file came from, by reading its headers.
//
// Not by filename. The Shopee order importer requires a filename like
// "shoppe_1-8_30-8.xlsx" because the name carries the date range, which appears
// nowhere in that file. Settlement files carry their own settlement dates, so
// the filename has no job to do — and making someone rename four different
// downloads to four different patterns invites the one mistake that matters
// most here: importing a file as the wrong platform, which silently files
// Shopee's money under TikTok.
//
// Headers cannot be got wrong that way. A file either has the columns or it does
// not.

import { headerKey } from "../customers/columns";
import type { SheetGrid } from "./parse";
import { SOURCE_LABELS, type SettlementSource } from "./types";

/**
 * Header fragments that identify each source, as folded keys.
 *
 * Fragments are matched as substrings of a folded header, so wording that drifts
 * ("Phí cố định" → "Phí cố định (%)") still matches. Each source needs
 * `minMatches` distinct fragments present before it is considered identified,
 * which keeps a single generic column like "order id" from claiming a file.
 */
interface SourceSignature {
  source: SettlementSource;
  fragments: string[];
  minMatches: number;
}

const SIGNATURES: SourceSignature[] = [
  {
    source: "shopee",
    // "tien ky quy" (escrow) is the decisive one: it is the net-payout column
    // and appears in the income report, not in the order export.
    fragments: ["tien ky quy", "phi co dinh", "phi dich vu", "phi xu ly giao dich", "ma don hang"],
    minMatches: 3,
  },
  {
    source: "tiktok",
    fragments: [
      "settlement amount",
      "total settlement amount",
      "order adjustment id",
      "tiktok shop commission fee",
      "transaction fee",
      "settlement date",
    ],
    minMatches: 3,
  },
  {
    source: "spx-cod",
    fragments: ["tien thu ho", "ma van don", "trang thai van don", "cod"],
    minMatches: 2,
  },
  {
    source: "spx-fee",
    fragments: ["phi giao hang", "ma van don", "phi bao hiem", "phi hoan hang", "cuoc"],
    minMatches: 2,
  },
];

export interface DetectionResult {
  source: SettlementSource;
  /** The sheet the data was found on. */
  grid: SheetGrid;
  /** Which fragments matched, for the confirmation panel. */
  matched: string[];
}

/**
 * Identify the source and pick the sheet holding its data.
 *
 * Every sheet is scored against every signature and the best pairing wins, so a
 * multi-sheet export (TikTok ships a "Fees explanation" tab alongside the data)
 * lands on the sheet that actually carries the columns.
 */
export function detectSource(grids: SheetGrid[]): DetectionResult {
  let best: (DetectionResult & { score: number }) | null = null;

  for (const grid of grids) {
    const folded = grid.headers.map((h) => headerKey(h)).filter((h) => h.length > 0);
    for (const sig of SIGNATURES) {
      const matched = sig.fragments.filter((f) => folded.some((h) => h.includes(f)));
      if (matched.length < sig.minMatches) continue;
      // More matched fragments is a better fit; ties go to the sheet with data
      // in it, since an explanation tab can echo the data tab's column names.
      const score = matched.length * 1000 + Math.min(grid.rows.length, 999);
      if (!best || score > best.score) {
        best = { source: sig.source, grid, matched, score };
      }
    }
  }

  if (!best) {
    throw new Error(
      "Không nhận diện được tệp này thuộc sàn nào. " +
        `Tab Đối soát nhận file: ${Object.values(SOURCE_LABELS).join(", ")}. ` +
        "Lưu ý file đối soát khác file đơn hàng: với Shopee hãy tải ở Tài chính → Doanh thu, " +
        "không phải Đơn hàng → Xuất.",
    );
  }

  if (best.grid.rows.length === 0) {
    throw new Error(
      `Nhận diện được tệp ${SOURCE_LABELS[best.source]} nhưng sheet "${best.grid.sheetName}" không có dòng dữ liệu nào.`,
    );
  }

  return { source: best.source, grid: best.grid, matched: best.matched };
}
