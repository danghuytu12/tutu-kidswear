import type { Document } from "mongodb";
import { customersCollection } from "../collections";
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
