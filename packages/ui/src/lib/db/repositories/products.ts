import { ObjectId, type Document } from "mongodb";
import { productsCollection } from "../collections";
import type { Product } from "../../types";
import type { ProductDoc, ProductInput, ProductVariant } from "../types";

// Map a raw Mongo document to the serializable ProductDoc (stringified _id).
function toProductDoc(doc: Document): ProductDoc {
  const { _id, ...rest } = doc;
  return { _id: String(_id), ...(rest as Omit<ProductDoc, "_id">) };
}

function formatVnd(price: number): string {
  return `${Math.round(price).toLocaleString("vi-VN")} ₫`;
}

/**
 * Derive the storefront pricing fields (price/sale/orig/disc) from the first
 * variant's `sellPrice` and the product-wide discount. If a discount applies,
 * `sale` = discounted price and `orig` = the pre-discount `sellPrice`.
 */
function derivePricing(
  variants: ProductVariant[],
  discountPct: number,
): {
  price: number;
  sale: string;
  orig?: string;
  disc?: string;
} {
  const first = variants[0];
  if (!first) return { price: 0, sale: formatVnd(0) };
  const pct = Math.min(Math.max(discountPct || 0, 0), 100);
  const discounted = Math.round(first.sellPrice * (1 - pct / 100));
  if (pct > 0) {
    return {
      price: discounted,
      sale: formatVnd(discounted),
      orig: formatVnd(first.sellPrice),
      disc: `(-${pct}%)`,
    };
  }
  return { price: first.sellPrice, sale: formatVnd(first.sellPrice) };
}

/**
 * Normalize an incoming product payload: recompute derived pricing + thumbnail
 * from `variants`/`discountPct`/`images` so the stored doc is self-consistent.
 */
function normalizeProductInput(input: ProductInput): ProductInput {
  const variants = Array.isArray(input.variants) ? input.variants : [];
  const discountPct = Math.min(Math.max(input.discountPct ?? 0, 0), 100);
  const pricing = derivePricing(variants, discountPct);
  const thumbnail =
    input.images?.[0] ?? input.img ?? "/images/tailadmin/product/product-01.jpg";
  return {
    ...input,
    variants,
    discountPct,
    isNew: Boolean(input.isNew),
    isBestSeller: Boolean(input.isBestSeller),
    img: thumbnail,
    price: pricing.price,
    sale: pricing.sale,
    orig: pricing.orig,
    disc: pricing.disc,
  };
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
  const toInsert = {
    ...normalizeProductInput(input),
    createdAt: new Date().toISOString(),
  };
  const result = await col.insertOne(toInsert);
  return { _id: String(result.insertedId), ...toInsert };
}

export async function updateProduct(
  id: string,
  input: Partial<ProductInput>,
): Promise<ProductDoc | null> {
  if (!ObjectId.isValid(id)) return null;
  const col = await productsCollection();
  // When variants are part of the update, recompute derived pricing/thumbnail
  // so stored fields stay consistent with the variant source of truth.
  const patch = input.variants
    ? normalizeProductInput(input as ProductInput)
    : input;
  const doc = await col.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: patch },
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
