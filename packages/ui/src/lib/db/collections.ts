import type { Collection, Document } from "mongodb";
import { getDb } from "./client";

// Typed collection getters. These hold the "on-disk" document shapes where _id is
// a real ObjectId (managed by the driver); repositories map to the serializable
// public types. We keep the stored shape loose (Document) and let repositories
// enforce the typed contract, avoiding ObjectId/string friction here.

export async function productsCollection(): Promise<Collection<Document>> {
  return (await getDb()).collection("products");
}

export async function ordersCollection(): Promise<Collection<Document>> {
  return (await getDb()).collection("orders");
}

export async function customersCollection(): Promise<Collection<Document>> {
  return (await getDb()).collection("customers");
}

/** Line-item rows imported from Shopee order exports. */
export async function shopeeOrderRowsCollection(): Promise<Collection<Document>> {
  return (await getDb()).collection("shopeeOrderRows");
}

/** One document per uploaded Shopee export, holding its counters. */
export async function shopeeImportsCollection(): Promise<Collection<Document>> {
  return (await getDb()).collection("shopeeImports");
}
