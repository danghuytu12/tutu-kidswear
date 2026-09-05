// Which spreadsheet columns the importer reads, and the guard that verifies a
// file really is a Shopee export before we trust those positions.

/** A1-style column reference → 0-based index. "A"→0, "AA"→26, "BJ"→61. */
export function colToIndex(ref: string): number {
  let n = 0;
  for (const ch of ref.toUpperCase()) {
    n = n * 26 + (ch.charCodeAt(0) - 64);
  }
  return n - 1;
}

/**
 * The fields we extract, bound by COLUMN POSITION with the header text kept as
 * a cross-check.
 *
 * Position is the source of truth on purpose. Columns AC and AT are headed
 * "Tổng số tiền Người mua thanh toán" and "Tổng số tiền người mua thanh toán"
 * — identical but for the capitalisation of "Người mua". Matching on header
 * text alone binds AC into the revenue field and yields a plausible but wrong
 * total, with nothing to signal the mistake. Matching on position cannot make
 * that error, and the header assertion catches the day Shopee shifts a column.
 *
 * Buyer identity columns (BB Người Mua, BC Tên Người nhận, BD Số điện thoại,
 * BH Địa chỉ nhận hàng) are deliberately absent: this feature reports revenue
 * and has no need for personal data, so none of it is parsed or stored.
 */
export const SHOPEE_COLUMNS = {
  orderCode: { col: "A", header: "Mã đơn hàng" },
  orderDate: { col: "C", header: "Ngày đặt hàng" },
  status: { col: "D", header: "Trạng Thái Đơn Hàng" },
  productName: { col: "Q", header: "Tên sản phẩm" },
  variantName: { col: "U", header: "Tên phân loại hàng" },
  unitPrice: { col: "Z", header: "Giá ưu đãi" },
  quantity: { col: "AA", header: "Số lượng" },
  orderValue: { col: "AD", header: "Tổng giá trị đơn hàng (VND)" },
  buyerPaidTotal: { col: "AT", header: "Tổng số tiền người mua thanh toán" },
} as const;

export type ShopeeField = keyof typeof SHOPEE_COLUMNS;

/** Field → 0-based column index. */
export type ColumnIndexes = Record<ShopeeField, number>;

/**
 * Canonicalise a header for comparison.
 *
 * NFC matters as much as the whitespace collapse: the real export mixes Unicode
 * forms, writing "Giá ưu đãi" (column Z) decomposed as "a" + combining acute
 * while every other header uses precomposed characters. The two render
 * identically and compare unequal, so without normalising, a genuine Shopee
 * file is rejected as malformed.
 */
function normalizeHeader(s: string): string {
  return s.normalize("NFC").replace(/\s+/g, " ").trim();
}

/**
 * Verify the header row matches a Shopee export and return the column indexes.
 *
 * Throws on any mismatch rather than falling back to a fuzzy search — a fuzzy
 * match on the revenue column would silently bind AC instead of AT (see the
 * note on SHOPEE_COLUMNS), which is the worst failure this importer can have.
 */
export function resolveColumns(headers: string[]): ColumnIndexes {
  const out = {} as ColumnIndexes;
  for (const [field, spec] of Object.entries(SHOPEE_COLUMNS)) {
    const idx = colToIndex(spec.col);
    const actual = normalizeHeader(headers[idx] ?? "");
    // Normalise both sides: the literals above are NFC today, but that is a
    // property of this source file's encoding, not something to depend on.
    if (actual !== normalizeHeader(spec.header)) {
      throw new Error(
        `Tệp không đúng định dạng Shopee: cột ${spec.col} phải là "${spec.header}" nhưng đang là "${actual}".`,
      );
    }
    out[field as ShopeeField] = idx;
  }
  return out;
}
