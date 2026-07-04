import type { Document } from "mongodb";
import { customersCollection } from "../collections";
import { listOrders } from "./orders";
import type { CustomerDoc, CustomerInput } from "../types";

function toCustomerDoc(doc: Document): CustomerDoc {
  const { _id, ...rest } = doc;
  return { _id: String(_id), ...(rest as Omit<CustomerDoc, "_id">) };
}

export async function listCustomers(): Promise<CustomerDoc[]> {
  const col = await customersCollection();
  const docs = await col.find({}).sort({ createdAt: -1 }).toArray();
  return docs.map(toCustomerDoc);
}

export async function createCustomer(
  input: CustomerInput,
): Promise<CustomerDoc> {
  const col = await customersCollection();
  const toInsert = { ...input, createdAt: new Date().toISOString() };
  const result = await col.insertOne(toInsert);
  return { _id: String(result.insertedId), ...toInsert };
}

/** A product a customer bought, with the total quantity across all their orders. */
export interface PurchasedProduct {
  name: string;
  qty: number;
}

/** A customer derived from their orders, with everything they've purchased. */
export interface CustomerWithPurchases {
  name: string;
  phone: string;
  /** Number of (non-cancelled) orders this customer placed. */
  orderCount: number;
  /** Total spend (VND) across those orders. */
  totalSpent: number;
  /** Total units bought across all products. */
  totalItems: number;
  /** Distinct products bought, quantities summed, most-bought first. */
  products: PurchasedProduct[];
  /** ISO date of this customer's most recent order. */
  lastOrderAt: string;
}

/**
 * Build the customer list from orders — the real source of "who bought what".
 * A customer is identified by phone number AND name together: orders collapse
 * into one row only when both match (case/space-insensitively). Cancelled orders
 * are excluded. Products are summed per customer across all their orders and
 * sorted by quantity. Customers are returned most-recent-order first.
 */
export async function getCustomersWithPurchases(): Promise<
  CustomerWithPurchases[]
> {
  const orders = await listOrders();
  const byCustomer = new Map<
    string,
    {
      name: string;
      phone: string;
      orderCount: number;
      totalSpent: number;
      products: Map<string, number>;
      lastOrderAt: string;
    }
  >();

  for (const o of orders) {
    if (o.status === "cancelled") continue;
    const phone = o.customerPhone?.trim() ?? "";
    const name = o.customerName?.trim() ?? "";
    // Identity = phone + name together: only orders sharing BOTH the same phone
    // AND the same name collapse into one customer. Normalised (lowercased) so
    // trivial case/spacing differences still match.
    const key = `${phone.toLowerCase()}|${name.toLowerCase()}` || "unknown";
    const entry =
      byCustomer.get(key) ??
      {
        name,
        phone,
        orderCount: 0,
        totalSpent: 0,
        products: new Map<string, number>(),
        lastOrderAt: o.createdAt,
      };
    entry.orderCount += 1;
    entry.totalSpent += o.total;
    if (o.createdAt > entry.lastOrderAt) entry.lastOrderAt = o.createdAt;
    for (const item of o.items) {
      entry.products.set(
        item.name,
        (entry.products.get(item.name) ?? 0) + item.qty,
      );
    }
    byCustomer.set(key, entry);
  }

  return [...byCustomer.values()]
    .map((e) => {
      const products = [...e.products.entries()]
        .map(([name, qty]) => ({ name, qty }))
        .sort((a, b) => b.qty - a.qty);
      return {
        name: e.name,
        phone: e.phone,
        orderCount: e.orderCount,
        totalSpent: e.totalSpent,
        totalItems: products.reduce((sum, p) => sum + p.qty, 0),
        products,
        lastOrderAt: e.lastOrderAt,
      };
    })
    .sort((a, b) => (a.lastOrderAt < b.lastOrderAt ? 1 : -1));
}
