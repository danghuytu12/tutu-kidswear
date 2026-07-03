// packages/ui/src/lib/cart.ts
// Shared cart types + helpers (no React, no DOM — safe to import anywhere).

export interface CartItem {
  href: string;
  name: string;
  img: string;
  /** Numeric VND price. */
  price: number;
  qty: number;
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
