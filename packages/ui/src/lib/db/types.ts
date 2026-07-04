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
  inStock: boolean;
  /** Purchasable variants (color/size/pricing). Source of truth for price. */
  variants: ProductVariant[];
  /** Product-wide cost / purchase price in VND (giá mua). */
  buyPrice?: number;
  /** Product-wide discount percentage 0–100 (phần trăm khuyến mại). */
  discountPct?: number;
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

export interface OrderItem {
  name: string;
  price: number;
  qty: number;
  /** Product thumbnail URL, captured at order time. Optional: older orders lack it. */
  img?: string;
  /** Storefront href of the product, captured at order time. Optional for older orders. */
  href?: string;
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

export interface CustomerDoc {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
}

export type CustomerInput = {
  name: string;
  email: string;
};
