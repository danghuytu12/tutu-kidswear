import { ObjectId, type Document } from "mongodb";
import { ordersCollection } from "../collections";
import { shippingFee } from "../../cart";
import type { OrderDoc, OrderInput } from "../types";

function toOrderDoc(doc: Document): OrderDoc {
  const { _id, ...rest } = doc;
  return { _id: String(_id), ...(rest as Omit<OrderDoc, "_id">) };
}

export async function listOrders(): Promise<OrderDoc[]> {
  const col = await ordersCollection();
  const docs = await col.find({}).sort({ createdAt: -1 }).toArray();
  return docs.map(toOrderDoc);
}

/** Escape a user string so it is safe to embed literally in a RegExp. */
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Search orders by order code (full or partial ObjectId hex, "#" tolerated),
 * customer name, or phone — case-insensitive, newest first. An empty/blank
 * query returns all orders.
 */
export async function searchOrders(query: string): Promise<OrderDoc[]> {
  const q = query.trim().replace(/^#/, "");
  if (!q) return listOrders();
  const col = await ordersCollection();
  const rx = escapeRegex(q);
  const docs = await col
    .find({
      $or: [
        // Match the stringified _id against the query (supports partial codes).
        {
          $expr: {
            $regexMatch: {
              input: { $toString: "$_id" },
              regex: rx,
              options: "i",
            },
          },
        },
        { customerName: { $regex: rx, $options: "i" } },
        { customerPhone: { $regex: rx, $options: "i" } },
      ],
    })
    .sort({ createdAt: -1 })
    .toArray();
  return docs.map(toOrderDoc);
}

export async function getOrderById(id: string): Promise<OrderDoc | null> {
  if (!ObjectId.isValid(id)) return null;
  const col = await ordersCollection();
  const doc = await col.findOne({ _id: new ObjectId(id) });
  return doc ? toOrderDoc(doc) : null;
}

/**
 * Insert an order. `id` lets the caller choose the ObjectId up front, so stock
 * can be reserved (and its ledger rows tagged) before the order exists.
 */
export async function createOrder(
  input: OrderInput,
  id: ObjectId = new ObjectId(),
): Promise<OrderDoc> {
  const col = await ordersCollection();
  const itemsTotal = input.items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const totalQty = input.items.reduce((sum, i) => sum + i.qty, 0);
  const toInsert = {
    items: input.items,
    total: itemsTotal + shippingFee(totalQty),
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    customerEmail: input.customerEmail ?? "",
    address: input.address,
    province: input.province,
    district: input.district,
    ward: input.ward,
    note: input.note,
    paymentMethod: input.paymentMethod,
    ...(input.paymentProof ? { paymentProof: input.paymentProof } : {}),
    status: "pending" as const,
    read: false,
    createdAt: new Date().toISOString(),
  };
  await col.insertOne({ _id: id, ...toInsert });
  return { _id: id.toHexString(), ...toInsert };
}

export async function updateOrderStatus(
  id: string,
  status: OrderDoc["status"],
): Promise<OrderDoc | null> {
  if (!ObjectId.isValid(id)) return null;
  const col = await ordersCollection();
  const doc = await col.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { status } },
    { returnDocument: "after" },
  );
  return doc ? toOrderDoc(doc) : null;
}

/**
 * Change status only if it is still `from` — a compare-and-swap, so two admins
 * flipping the same order at once can't both apply the stock side effect.
 * Returns null when the order is missing or its status already moved on.
 */
export async function transitionOrderStatus(
  id: string,
  from: OrderDoc["status"],
  to: OrderDoc["status"],
): Promise<OrderDoc | null> {
  if (!ObjectId.isValid(id)) return null;
  const col = await ordersCollection();
  const doc = await col.findOneAndUpdate(
    { _id: new ObjectId(id), status: from },
    { $set: { status: to } },
    { returnDocument: "after" },
  );
  return doc ? toOrderDoc(doc) : null;
}

/** Delete an order by id. Returns true when a document was removed. */
export async function deleteOrder(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const col = await ordersCollection();
  const result = await col.deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
}

/**
 * Delete many orders by id in one call. Invalid ids are ignored. Returns the
 * number of documents actually removed.
 */
export async function deleteOrders(ids: string[]): Promise<number> {
  const objectIds = ids.filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id));
  if (objectIds.length === 0) return 0;
  const col = await ordersCollection();
  const result = await col.deleteMany({ _id: { $in: objectIds } });
  return result.deletedCount ?? 0;
}

/** Unread orders (read !== true), newest first, capped at `limit`. */
export async function listUnreadOrders(limit = 20): Promise<OrderDoc[]> {
  const col = await ordersCollection();
  const docs = await col
    .find({ read: { $ne: true } })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
  return docs.map(toOrderDoc);
}

/** Count of unread orders (read !== true). */
export async function countUnreadOrders(): Promise<number> {
  const col = await ordersCollection();
  return col.countDocuments({ read: { $ne: true } });
}

/** Mark an order read. False for an invalid id or when no document matched. */
export async function markOrderRead(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const col = await ordersCollection();
  const result = await col.updateOne(
    { _id: new ObjectId(id) },
    { $set: { read: true } },
  );
  return result.matchedCount === 1;
}
