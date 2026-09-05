import type { AnyBulkWriteOperation, Document } from "mongodb";
import { customersCollection } from "../collections";
import { listOrders } from "./orders";
import { normalizePhone } from "../../customers/map";
import type { CustomerDoc, CustomerInput } from "../types";

/** Created once per warm instance, on the write path only. */
let indexesReady: Promise<void> | null = null;

async function ensureIndexes(): Promise<void> {
  indexesReady ??= (async () => {
    const col = await customersCollection();
    // Phone is the merge key for both re-imports and order matching.
    await col.createIndex({ phone: 1 }, { unique: true });
  })();
  await indexesReady;
}

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

export interface ImportCustomersResult {
  inserted: number;
  updated: number;
}

/**
 * Upsert imported customers, keyed on phone.
 *
 * Re-importing the same file updates in place rather than duplicating — the
 * opposite of the Shopee importer, which clears a date range and re-inserts.
 * A customer list is cumulative, so nothing is ever deleted here.
 *
 * Only fields present in `input` are written: a sheet carrying just name and
 * phone must not wipe the email and address a fuller import stored earlier.
 */
export async function importCustomers(
  rows: CustomerInput[],
): Promise<ImportCustomersResult> {
  if (rows.length === 0) return { inserted: 0, updated: 0 };
  await ensureIndexes();

  const col = await customersCollection();
  const now = new Date().toISOString();

  const ops: AnyBulkWriteOperation<Document>[] = rows.map((row) => {
    const { phone, ...rest } = row;
    return {
      updateOne: {
        filter: { phone },
        update: {
          $set: { ...rest, updatedAt: now },
          $setOnInsert: { phone, createdAt: now },
        },
        upsert: true,
      },
    };
  });

  const res = await col.bulkWrite(ops, { ordered: false });
  const inserted = res.upsertedCount ?? 0;
  return { inserted, updated: rows.length - inserted };
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
  /** ISO date of this customer's most recent order. Empty when they have none. */
  lastOrderAt: string;
  /** Where this row came from: orders, the imported address book, or both. */
  origin: "order" | "import" | "both";
  /** Address-book fields, present only for imported customers. */
  email?: string;
  address?: string;
  note?: string;
  source?: string;
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
  const [orders, imported] = await Promise.all([listOrders(), listCustomers()]);
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
    const entry = byCustomer.get(key) ?? {
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

  const rows: CustomerWithPurchases[] = [...byCustomer.values()].map((e) => {
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
      origin: "order" as const,
    };
  });

  // Fold in the imported address book, keyed on phone alone — the grouping
  // above uses phone+name, so one imported record can enrich several rows that
  // share a number under different spellings of the name.
  const byPhone = new Map<string, CustomerWithPurchases[]>();
  for (const row of rows) {
    const key = normalizePhone(row.phone);
    if (!key) continue;
    const list = byPhone.get(key) ?? [];
    list.push(row);
    byPhone.set(key, list);
  }

  for (const doc of imported) {
    const key = normalizePhone(doc.phone ?? "");
    if (!key) continue;
    const matches = byPhone.get(key);
    const extras = {
      email: doc.email,
      address: [doc.address, doc.ward, doc.district, doc.province]
        .filter(Boolean)
        .join(", "),
      note: doc.note,
      source: doc.source,
    };

    if (matches) {
      for (const row of matches) Object.assign(row, extras, { origin: "both" });
      continue;
    }

    // Known to the shop but has not ordered yet.
    rows.push({
      name: doc.name,
      phone: doc.phone,
      orderCount: 0,
      totalSpent: 0,
      totalItems: 0,
      products: [],
      lastOrderAt: "",
      origin: "import",
      ...extras,
    });
  }

  // Customers who have ordered come first, most recent first; those who have
  // not (no lastOrderAt) sort to the end by name.
  return rows.sort((a, b) => {
    if (a.lastOrderAt && b.lastOrderAt) {
      return a.lastOrderAt < b.lastOrderAt ? 1 : -1;
    }
    if (a.lastOrderAt) return -1;
    if (b.lastOrderAt) return 1;
    return a.name.localeCompare(b.name, "vi");
  });
}
