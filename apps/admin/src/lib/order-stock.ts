import { restoreStockForOrder } from "@repo/ui/lib/db/repositories/inventory";
import type { OrderDoc } from "@repo/ui/lib/db/types";

/**
 * Deleting an order that still holds stock (not shipped, not cancelled) puts
 * the units back on the shelf. Shipped goods have left the shop and cancelled
 * orders already returned theirs, so neither touches stock.
 */
export async function releaseStockOnDelete(order: OrderDoc): Promise<void> {
  if (order.status === "pending" || order.status === "paid") {
    await restoreStockForOrder(order.items, order._id, "cancel");
  }
}
