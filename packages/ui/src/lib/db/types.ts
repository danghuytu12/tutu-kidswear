import type { Product } from "../types";

// Document shapes stored in MongoDB. `_id` is the stringified ObjectId in the
// values returned by repositories (never the raw ObjectId), so these types are
// safe to serialize across the API/Server-Component boundary.

/**
 * One purchasable variant of a product: a {color, size} combination with its
 * own selling price. A product carries an array of these.
 */
export interface ProductVariant {
  /** Colour label, e.g. "Đỏ", "Xanh navy". */
  color: string;
  /** Size label, e.g. "66", "90", "Freesize". */
  size: string;
  /** Selling price in VND before discount (giá bán). */
  sellPrice: number;
  /**
   * Units on hand for this colour×size.
   *
   * Absent means NOT TRACKED, which is emphatically not the same as 0: the
   * products that predate inventory keep selling untouched until someone
   * records a real count for them, while 0 means genuinely sold out and blocks
   * the sale. Backfilling zeros would take the whole catalogue offline the day
   * this shipped, so absent is the only honest starting value.
   */
  stock?: number;
  /** Low-stock alert threshold for this variant. Absent = the shop-wide default. */
  lowStockThreshold?: number;
}

/**
 * A product document. Extends the storefront `Product` shape so existing UI
 * components (ProductCard, ProductGrid) keep working after mapping.
 *
 * `price`/`sale`/`orig`/`disc`/`img` are DERIVED from `variants[0]` by the
 * repository on write — they exist only so storefront UI keeps working. The
 * source of truth for pricing is `variants`.
 */
export interface ProductDoc extends Product {
  _id: string;
  /** e.g. "Áo", "Váy", "Đồ bơi" — admin-facing category. */
  category: string;
  /** Numeric price in VND (derived from variants[0].sellPrice after discount). */
  price: number;
  /**
   * Whether the product is published (visible as finished) rather than a draft.
   *
   * Named `inStock` until inventory arrived, which it never measured — the admin
   * form sets it from the Draft/Publish button. It is read through
   * `isPublished()` so documents written under the old name keep working.
   */
  published?: boolean;
  /** @deprecated Old name for `published`. Read via isPublished(); never written. */
  inStock?: boolean;
  /**
   * Sum of tracked variant stock, kept in step by the same atomic update that
   * changes a variant. Denormalised only so stock queries can filter in Mongo
   * instead of summing every variant in JS; the variant array stays
   * authoritative. Absent while no variant is tracked.
   */
  totalStock?: number;
  /** Purchasable variants (color/size/pricing). Source of truth for price. */
  variants: ProductVariant[];
  /** Product-wide cost / purchase price in VND (giá mua). */
  buyPrice?: number;
  /** Selling price on Facebook in VND (giá bán Facebook). */
  facebookPrice?: number;
  /** Selling price on Shopee in VND (giá bán Shopee). */
  shopeePrice?: number;
  /** Selling price on TikTok Shop in VND (giá bán TikTok). */
  tiktokPrice?: number;
  /** Product-wide discount percentage 0–100 (phần trăm khuyến mại). */
  discountPct?: number;
  /** Flagged as a "new arrival" (sản phẩm mới) in admin. Absent/false = not new. */
  isNew?: boolean;
  /** Flagged as a "best seller" (sản phẩm bán chạy) in admin. Absent/false = not a best seller. */
  isBestSeller?: boolean;
  /** Rich-text (HTML) product description authored in the admin editor. */
  description?: string;
  /** Optional URL of a size-chart image shown on the product page. */
  sizeChartImage?: string;
  /**
   * All product image URLs (gallery). `img` mirrors `images[0]` as the
   * thumbnail used by list/card UI. Optional so older docs without it still map.
   */
  images?: string[];
  /** ISO date string. */
  createdAt: string;
  /** @deprecated Brand/collection label — kept optional for older docs only. */
  brand?: string;
}

/** Payload accepted when creating/updating a product (no _id/createdAt). */
export type ProductInput = Omit<ProductDoc, "_id" | "createdAt">;

/**
 * Whether a product is published.
 *
 * Reads the new field, falling back to the legacy `inStock` for documents
 * written before the rename. Defaults to published: every existing document has
 * `inStock: true`, and a product silently vanishing from the shop would be a far
 * worse failure than one appearing that should have stayed a draft.
 */
export function isPublished(doc: Pick<ProductDoc, "published" | "inStock">): boolean {
  return doc.published ?? doc.inStock ?? true;
}

/** Whether a variant takes part in stock control at all. */
export function isStockTracked(v: Pick<ProductVariant, "stock">): boolean {
  return typeof v.stock === "number";
}

/**
 * Whether a product should be advertised as available.
 *
 * A product with no variant tracked yet has no stock answer to give, so it falls
 * back to whether it is published — which is how availability behaved before
 * inventory existed. Once any variant is tracked, the real count decides.
 */
export function hasStock(
  doc: Pick<ProductDoc, "variants" | "published" | "inStock">,
): boolean {
  const tracked = (doc.variants ?? []).filter(isStockTracked);
  if (tracked.length === 0) return isPublished(doc);
  return tracked.some((v) => (v.stock ?? 0) > 0);
}

/** Shop-wide fallback when a variant sets no `lowStockThreshold`. */
export const DEFAULT_LOW_STOCK_THRESHOLD = 5;

/** Why a stock movement happened. Drives the ledger label and the expected sign. */
export const STOCK_REASONS = [
  "restock",
  "sale",
  "cancel",
  "recancel",
  "adjust",
] as const;

export type StockReason = (typeof STOCK_REASONS)[number];

export const STOCK_REASON_LABELS: Record<StockReason, string> = {
  restock: "Nhập kho",
  sale: "Bán hàng",
  cancel: "Hoàn kho (hủy đơn)",
  recancel: "Trừ lại (bỏ hủy)",
  adjust: "Điều chỉnh",
};

/**
 * One change to one variant's stock.
 *
 * An audit trail, never the source of truth: current stock lives on the variant.
 * Deriving it by replaying this collection would turn every "is it in stock?"
 * into an aggregation, and — worse — would reintroduce the read-sum-then-write
 * race that the atomic guarded update exists to eliminate.
 */
export interface StockMovementDoc {
  _id: string;
  productId: string;
  /** Denormalised so the ledger stays readable after a product is renamed. */
  productName: string;
  color: string;
  size: string;
  /** Signed change; negative leaves the warehouse. */
  delta: number;
  /**
   * Stock after this movement, as reported by the update that made it.
   * Lets the ledger be audited for gaps without replaying it: a row that does
   * not equal the previous row plus this delta is the footprint of a crash
   * between the inventory write and this append.
   */
  stockAfter: number;
  reason: StockReason;
  /** Set for sale/cancel/recancel — the link back to the order. */
  orderId?: string;
  /** Cost per unit in VND. Restock only (giá nhập của lô này). */
  costPrice?: number;
  note?: string;
  createdAt: string;
}

/** A variant that could not supply the quantity an order asked for. */
export interface InsufficientStock {
  name: string;
  color: string;
  size: string;
  requested: number;
  available: number;
}

/** e.g. "Áo thun (Sz 4 · MÀU ĐEN) — còn 2, cần 5" */
export function formatShortage(s: InsufficientStock): string {
  // size · colour, matching the order-line wording used in Telegram and the cart.
  const variant = [s.size, s.color].filter(Boolean).join(" · ");
  const label = variant ? `${s.name} (${variant})` : s.name;
  return `${label} — còn ${s.available}, cần ${s.requested}`;
}

/** Customer-facing message listing every shortage in one order. */
export function shortageMessage(shortages: InsufficientStock[]): string {
  const lines = shortages.map((s) => `• ${formatShortage(s)}`).join("\n");
  return `Rất tiếc, một số sản phẩm không đủ hàng:\n${lines}\nVui lòng giảm số lượng hoặc chọn mẫu khác.`;
}

export interface OrderItem {
  name: string;
  price: number;
  qty: number;
  /** Product thumbnail URL, captured at order time. Optional: older orders lack it. */
  img?: string;
  /** Storefront href of the product, captured at order time. Optional for older orders. */
  href?: string;
  /** Selected size variant, captured at order time. Absent for sizeless products / older orders. */
  size?: string;
  /** Selected colour variant, captured at order time. Absent for colourless products / older orders. */
  color?: string;
}

/** All valid order statuses, in lifecycle order. Source of truth for UI + validation.
 * Lives here (a pure, dependency-free module) so client components can import it
 * without pulling in the mongodb driver via the repository. */
export const ORDER_STATUSES = [
  "pending",
  "paid",
  "shipped",
  "cancelled",
] as const;

/** Vietnamese display labels for each order status. Source of truth for UI + notifications. */
export const ORDER_STATUS_LABELS: Record<(typeof ORDER_STATUSES)[number], string> = {
  pending: "Chờ xử lý",
  paid: "Đã thanh toán",
  shipped: "Đã giao",
  cancelled: "Đã hủy",
};

export interface OrderDoc {
  _id: string;
  items: OrderItem[];
  total: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  address: string;
  province: string;
  district: string;
  ward: string;
  note: string;
  paymentMethod: "cod" | "qr";
  /** Base64 (data URL) of the bank-transfer receipt — QR orders only. */
  paymentProof?: string;
  /** Whether an admin has read this order's notification. Absent/false = unread. */
  read?: boolean;
  status: (typeof ORDER_STATUSES)[number];
  createdAt: string;
}

export type OrderInput = {
  items: OrderItem[];
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  address: string;
  province: string;
  district: string;
  ward: string;
  note: string;
  paymentMethod: "cod" | "qr";
  /** Base64 (data URL) of the bank-transfer receipt — QR orders only. */
  paymentProof?: string;
};

/**
 * A customer in the address book — imported from a spreadsheet, and matched
 * against orders by phone number.
 *
 * Distinct from the order-derived customer list: this holds people the shop
 * knows about, whether or not they have bought anything yet.
 */
export interface CustomerDoc {
  _id: string;
  name: string;
  /** Normalised digits. The key for matching orders and re-imports. */
  phone: string;
  email?: string;
  address?: string;
  ward?: string;
  district?: string;
  province?: string;
  note?: string;
  /** Where they came from: Facebook, Shopee, TikTok, giới thiệu… */
  source?: string;
  createdAt: string;
  /** Stamped when a later import updated this record. */
  updatedAt?: string;
}

export type CustomerInput = Omit<CustomerDoc, "_id" | "createdAt" | "updatedAt">;

/**
 * One line-item row from a Shopee order export.
 *
 * The export is per line-item, not per order: an order with three products
 * produces three documents sharing an `orderCode`, and every one of them
 * repeats the order-level money fields. Revenue MUST therefore group by
 * `orderCode` before summing `buyerPaidTotal` — see getShopeeSummary.
 *
 * Buyer identity (columns BB/BC/BD/BH — name, recipient, phone, address) is
 * deliberately not mapped and not stored. This data is for revenue reporting;
 * it has no need for personal data, so none is kept. Do not add it.
 */
export interface ShopeeOrderRowDoc {
  _id: string;
  /** Column A "Mã đơn hàng", shared across every row of one order. */
  orderCode: string;
  /** Column C normalised to YYYY-MM-DD in Vietnam time. The overwrite key. */
  orderDayKey: string;
  /** Column C exactly as the sheet had it, kept so a misread date is traceable. */
  orderDateRaw: string;
  /** Column D "Trạng Thái Đơn Hàng", verbatim. */
  status: string;
  /** Column Q "Tên sản phẩm". */
  productName: string;
  /** Column U "Tên phân loại hàng" — the variant label. */
  variantName: string;
  /** Column Z "Giá ưu đãi" — unit sell price, VND. */
  unitPrice: number;
  /** Column AA "Số lượng". */
  quantity: number;
  /**
   * Column AT "Tổng số tiền người mua thanh toán" — ORDER-level, repeated on
   * every row of the order. The revenue metric. Note column AC carries a
   * near-identical header differing only in the capitalisation of "Người mua";
   * the two are not interchangeable.
   */
  buyerPaidTotal: number;
  /** Column AD "Tổng giá trị đơn hàng (VND)" — order-level, repeated. */
  orderValue: number;
  /** _id of the shopeeImports document this row came from. */
  importId: string;
  importedAt: string;
}

/**
 * Metadata for one uploaded export. The original file is not retained — only
 * the parsed rows — so these counters are the record of what an import did.
 */
export interface ShopeeImportDoc {
  _id: string;
  filename: string;
  /** Inclusive day range decoded from the filename. */
  rangeFrom: string;
  rangeTo: string;
  fileSize: number;
  /** Rows stored by this import. */
  rowCount: number;
  /** Distinct orders among them. */
  orderCount: number;
  /** Rows the per-day overwrite removed before this import's rows landed. */
  replacedRowCount: number;
  /** Deduped buyer-paid total for this import's rows, excluding cancellations. */
  totalRevenue: number;
  importedAt: string;
}
