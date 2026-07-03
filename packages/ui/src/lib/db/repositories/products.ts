import { ObjectId, type Document } from "mongodb";
import { productsCollection } from "../collections";
import type { Product } from "../../types";
import type { ProductDoc, ProductInput } from "../types";

// Map a raw Mongo document to the serializable ProductDoc (stringified _id).
function toProductDoc(doc: Document): ProductDoc {
  const { _id, ...rest } = doc;
  return { _id: String(_id), ...(rest as Omit<ProductDoc, "_id">) };
}

/** Reduce a ProductDoc to the storefront Product shape used by shared UI. */
export function toStorefrontProduct(doc: ProductDoc): Product {
  return {
    name: doc.name,
    href: doc.href,
    img: doc.img,
    sale: doc.sale,
    orig: doc.orig,
    disc: doc.disc,
  };
}

export async function listProducts(): Promise<ProductDoc[]> {
  const col = await productsCollection();
  const docs = await col.find({}).sort({ createdAt: -1 }).toArray();
  return docs.map(toProductDoc);
}

export async function getProductById(id: string): Promise<ProductDoc | null> {
  if (!ObjectId.isValid(id)) return null;
  const col = await productsCollection();
  const doc = await col.findOne({ _id: new ObjectId(id) });
  return doc ? toProductDoc(doc) : null;
}

/** Look up a product by its storefront href (e.g. "/products/ao-thun-xanh"). */
export async function getProductByHref(
  href: string,
): Promise<ProductDoc | null> {
  const col = await productsCollection();
  const doc = await col.findOne({ href });
  return doc ? toProductDoc(doc) : null;
}

export async function createProduct(input: ProductInput): Promise<ProductDoc> {
  const col = await productsCollection();
  const toInsert = { ...input, createdAt: new Date().toISOString() };
  const result = await col.insertOne(toInsert);
  return { _id: String(result.insertedId), ...toInsert };
}

export async function updateProduct(
  id: string,
  input: Partial<ProductInput>,
): Promise<ProductDoc | null> {
  if (!ObjectId.isValid(id)) return null;
  const col = await productsCollection();
  const doc = await col.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: input },
    { returnDocument: "after" },
  );
  return doc ? toProductDoc(doc) : null;
}

export async function deleteProduct(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const col = await productsCollection();
  const result = await col.deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
}
