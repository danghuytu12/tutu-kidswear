// packages/ui/src/lib/cart.ts
// Shared cart types + helpers (no React, no DOM — safe to import anywhere).

export interface CartItem {
  href: string;
  name: string;
  img: string;
  /** Numeric VND price. */
  price: number;
  qty: number;
  /** Selected size variant (e.g. "90"). Absent for products without sizes. */
  size?: string;
  /** Selected colour variant. Absent for products without colours. */
  color?: string;
}

/**
 * Stable identity for a cart line: same product AND same size AND same colour.
 * Two different variants of one product are distinct lines, so this is the key
 * used for merging, updating quantity, and removal.
 */
export function cartLineKey(item: Pick<CartItem, "href" | "size" | "color">): string {
  return `${item.href}|${item.size ?? ""}|${item.color ?? ""}`;
}

/** Parse a formatted VND price like "199.000 ₫" into 199000. */
export function parsePriceVnd(sale: string): number {
  const digits = (sale ?? "").replace(/[^\d]/g, "");
  return digits ? Number(digits) : 0;
}

/** Format a numeric VND price like 199000 into "199.000 ₫". */
export function formatVnd(price: number): string {
  return `${price.toLocaleString("vi-VN")} ₫`;
}

/** Shipping fee (VND) applied to orders with only 1 item. */
export const SINGLE_ITEM_SHIPPING_FEE = 29000;

/**
 * Shipping fee based on total quantity: free from 2 items up, otherwise a flat
 * 25.000₫. An empty cart has no fee.
 * @param totalQty sum of all item quantities in the cart.
 */
export function shippingFee(totalQty: number): number {
  if (totalQty <= 0) return 0;
  return totalQty >= 2 ? 0 : SINGLE_ITEM_SHIPPING_FEE;
}
