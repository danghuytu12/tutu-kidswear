import type { Document } from "mongodb";
import { ordersCollection } from "../collections";
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

/** Flat shipping fee added to every order (VND). */
export const SHIPPING_FEE = 30000;

export async function createOrder(input: OrderInput): Promise<OrderDoc> {
  const col = await ordersCollection();
  const itemsTotal = input.items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const toInsert = {
    items: input.items,
    total: itemsTotal + SHIPPING_FEE,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    customerEmail: input.customerEmail ?? "",
    address: input.address,
    province: input.province,
    district: input.district,
    ward: input.ward,
    note: input.note,
    paymentMethod: input.paymentMethod,
    status: "pending" as const,
    createdAt: new Date().toISOString(),
  };
  const result = await col.insertOne(toInsert);
  return { _id: String(result.insertedId), ...toInsert };
}
