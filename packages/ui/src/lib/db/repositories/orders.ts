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

export async function getOrderById(id: string): Promise<OrderDoc | null> {
  if (!ObjectId.isValid(id)) return null;
  const col = await ordersCollection();
  const doc = await col.findOne({ _id: new ObjectId(id) });
  return doc ? toOrderDoc(doc) : null;
}

export async function createOrder(input: OrderInput): Promise<OrderDoc> {
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
    createdAt: new Date().toISOString(),
  };
  const result = await col.insertOne(toInsert);
  return { _id: String(result.insertedId), ...toInsert };
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

/** Delete an order by id. Returns true when a document was removed. */
export async function deleteOrder(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const col = await ordersCollection();
  const result = await col.deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
}
