import type { Product } from "../types";

// Document shapes stored in MongoDB. `_id` is the stringified ObjectId in the
// values returned by repositories (never the raw ObjectId), so these types are
// safe to serialize across the API/Server-Component boundary.

/**
 * A product document. Extends the storefront `Product` shape so existing UI
 * components (ProductCard, ProductGrid) keep working after mapping.
 */
export interface ProductDoc extends Product {
  _id: string;
  /** e.g. "Áo", "Váy", "Đồ bơi" — admin-facing category. */
  category: string;
  /** Brand / collection label. */
  brand: string;
  /** Numeric price in VND (source of truth; `sale` is the formatted string). */
  price: number;
  inStock: boolean;
  /**
   * All product image URLs (gallery). `img` mirrors `images[0]` as the
   * thumbnail used by list/card UI. Optional so older docs without it still map.
   */
  images?: string[];
  /** ISO date string. */
  createdAt: string;
}

/** Payload accepted when creating/updating a product (no _id/createdAt). */
export type ProductInput = Omit<ProductDoc, "_id" | "createdAt">;

export interface OrderItem {
  name: string;
  price: number;
  qty: number;
}

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
  status: "pending" | "paid" | "shipped" | "cancelled";
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
