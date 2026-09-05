// Which spreadsheet columns the customer importer reads, and how a header row
// is matched to them.
//
// Unlike the Shopee importer — which binds columns by POSITION because the file
// is machine-generated and fixed — this sheet is filled in by hand from our own
// template. People reorder columns, rename "Số điện thoại" to "SĐT", and paste
// in extra columns of their own. So matching is by header TEXT, loosely: accents
// stripped, case folded, punctuation dropped.

/** The fields we read. `required` ones must be present or the import is refused. */
export const CUSTOMER_COLUMNS = {
  name: {
    header: "Họ tên",
    aliases: ["ho ten", "ten khach hang", "ten khach", "ten", "name"],
    required: true,
  },
  phone: {
    header: "Số điện thoại",
    aliases: ["sdt", "so dien thoai", "dien thoai", "phone", "mobile"],
    required: true,
  },
  email: {
    header: "Email",
    aliases: ["e mail", "thu dien tu"],
    required: false,
  },
  address: {
    header: "Địa chỉ",
    aliases: ["dia chi", "dia chi chi tiet", "address"],
    required: false,
  },
  ward: {
    header: "Phường/Xã",
    aliases: ["phuong xa", "phuong", "xa", "ward"],
    required: false,
  },
  district: {
    header: "Quận/Huyện",
    aliases: ["quan huyen", "quan", "huyen", "district"],
    required: false,
  },
  province: {
    header: "Tỉnh/TP",
    aliases: ["tinh tp", "tinh thanh pho", "tinh", "thanh pho", "province", "city"],
    required: false,
  },
  note: {
    header: "Ghi chú",
    aliases: ["ghi chu", "note", "notes"],
    required: false,
  },
  source: {
    header: "Nguồn khách",
    aliases: ["nguon khach", "nguon", "source"],
    required: false,
  },
} as const;

export type CustomerField = keyof typeof CUSTOMER_COLUMNS;

/** Field → 0-based column index. Absent for optional columns the file omits. */
export type CustomerColumnIndexes = Partial<Record<CustomerField, number>> &
  Record<"name" | "phone", number>;

/**
 * Fold a header to a comparison key: NFC first (the same Vietnamese string can
 * arrive decomposed or precomposed and the two compare unequal), then accents
 * off, lowercased, and everything but letters/digits collapsed to spaces.
 */
export function headerKey(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Every accepted spelling of a field, as comparison keys. */
function keysFor(field: CustomerField): string[] {
  const spec = CUSTOMER_COLUMNS[field];
  return [headerKey(spec.header), ...spec.aliases.map(headerKey)];
}

/**
 * Locate each field in the header row.
 *
 * Throws when a required column is missing — naming the column in Vietnamese,
 * since the person fixing the file is looking at a spreadsheet, not at code.
 */
export function resolveCustomerColumns(
  headers: string[],
): CustomerColumnIndexes {
  const found: Partial<Record<CustomerField, number>> = {};
  const seen = headers.map(headerKey);

  for (const field of Object.keys(CUSTOMER_COLUMNS) as CustomerField[]) {
    const accepted = keysFor(field);
    const idx = seen.findIndex((h) => h.length > 0 && accepted.includes(h));
    if (idx !== -1) found[field] = idx;
  }

  const missing = (Object.keys(CUSTOMER_COLUMNS) as CustomerField[])
    .filter((f) => CUSTOMER_COLUMNS[f].required && found[f] === undefined)
    .map((f) => `"${CUSTOMER_COLUMNS[f].header}"`);

  if (missing.length > 0) {
    throw new Error(
      `Tệp thiếu cột bắt buộc: ${missing.join(", ")}. Hãy tải file mẫu và điền theo đúng tiêu đề cột.`,
    );
  }

  return found as CustomerColumnIndexes;
}
