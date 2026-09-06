// Stock movements: the only code allowed to change a variant's `stock`.
//
// The whole design rests on one property — the sufficiency check lives in the
// QUERY FILTER, never in application code. Mongo evaluates the filter and
// applies the update as a single atomic act on one document, so there is no
// window between "I checked stock is 3" and "I subtracted 2" for a second order
// to slip through. Read-then-check-then-write cannot offer that, at any speed.
//
// Everything here fails toward UNDERSTATING stock. That asymmetry is deliberate:
// understating means a customer is wrongly told something is sold out, which is
// recoverable; overstating means selling something that does not exist, which is
// not.

import { ObjectId, type Document } from "mongodb";
import { productsCollection, stockMovementsCollection } from "../collections";
import {
  DEFAULT_LOW_STOCK_THRESHOLD,
  isStockTracked,
  type InsufficientStock,
  type OrderItem,
  type ProductDoc,
  type ProductVariant,
  type StockMovementDoc,
  type StockReason,
} from "../types";
import { getProductByHref } from "./products";

let indexesReady: Promise<void> | null = null;

async function ensureIndexes(): Promise<void> {
  indexesReady ??= (async () => {
    const col = await stockMovementsCollection();
    await Promise.all([
      // The per-product history panel on the restock page.
      col.createIndex({ productId: 1, createdAt: -1 }),
      // "What did this order do to stock?" — forensics after a mismatch.
      col.createIndex({ orderId: 1 }),
      // The reverse-chronological ledger feed.
      col.createIndex({ createdAt: -1 }),
    ]);
  })();
  await indexesReady;
}

/** One variant's worth of movement, resolved to a concrete product. */
export interface StockLine {
  productId: string;
  /** Denormalised for ledger rows and shortage messages. */
  productName: string;
  color: string;
  size: string;
  qty: number;
}

export type ReserveResult =
  | { ok: true; applied: StockLine[]; skipped: OrderItem[] }
  | { ok: false; shortages: InsufficientStock[] };

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Anchored, case-insensitive exact match on a free-text variant label.
 *
 * Case-insensitive because colour and size are typed by hand in the admin form:
 * an order placed against "MÀU ĐEN" must still find the variant after someone
 * retypes it as "Màu Đen". Anchored and escaped so a label containing regex
 * punctuation matches literally rather than as a pattern.
 */
function ci(value: string): { $regex: RegExp } {
  return { $regex: new RegExp(`^${escapeRegex(value.trim())}$`, "i") };
}

/**
 * Add `delta` to one variant's stock, atomically, refusing to go negative.
 *
 * The guard appears TWICE on purpose: in the top-level filter it decides whether
 * the document matches at all, and in `arrayFilters` it decides which element
 * `$[v]` binds to. Omitting it from `arrayFilters` would let a product match on
 * one variant and then decrement a different one.
 *
 * `totalStock` rides along in the same `$inc` so the denormalised sum can never
 * drift from the array it summarises.
 *
 * Returns false when nothing was written — for a negative delta that means
 * insufficient stock, an untracked variant (absent `stock` fails `$gte`), or no
 * such variant. The caller distinguishes those; here they are all "did nothing".
 */
async function applyVariantDelta(
  productId: string,
  color: string,
  size: string,
  delta: number,
): Promise<boolean> {
  if (!ObjectId.isValid(productId) || delta === 0) return false;
  const col = await productsCollection();
  // A positive delta needs no headroom; a negative one needs at least its size.
  const required = delta < 0 ? -delta : 0;
  const match = { color: ci(color), size: ci(size), stock: { $gte: required } };

  const res = await col.updateOne(
    { _id: new ObjectId(productId), variants: { $elemMatch: match } },
    { $inc: { "variants.$[v].stock": delta, totalStock: delta } },
    {
      arrayFilters: [
        { "v.color": match.color, "v.size": match.size, "v.stock": match.stock },
      ],
    },
  );
  return res.modifiedCount === 1;
}

/** Current stock of one variant, or null when it is untracked or missing. */
async function readVariantStock(
  productId: string,
  color: string,
  size: string,
): Promise<number | null> {
  if (!ObjectId.isValid(productId)) return null;
  const col = await productsCollection();
  const doc = await col.findOne({ _id: new ObjectId(productId) });
  if (!doc) return null;
  const variants = (doc.variants ?? []) as ProductVariant[];
  const found = variants.find(
    (v) =>
      v.color.trim().toLowerCase() === color.trim().toLowerCase() &&
      v.size.trim().toLowerCase() === size.trim().toLowerCase(),
  );
  return found && isStockTracked(found) ? (found.stock ?? 0) : null;
}

/**
 * Append a ledger row.
 *
 * Best-effort by contract, exactly like the Telegram calls: a failure to record
 * history must never fail the order that made the history. A missed row shows up
 * as a `stockAfter` discontinuity, which is what makes the gap findable later.
 */
async function recordMovement(
  entry: Omit<StockMovementDoc, "_id" | "createdAt">,
): Promise<void> {
  try {
    await ensureIndexes();
    const col = await stockMovementsCollection();
    await col.insertOne({ ...entry, createdAt: new Date().toISOString() });
  } catch (err) {
    console.error(
      "[inventory] ledger append failed:",
      err instanceof Error ? err.message : err,
    );
  }
}

/**
 * Resolve order lines to concrete variants.
 *
 * `OrderItem` carries `href` plus optional size/colour but no product id — the
 * cart predates inventory. `href` survives renames (the form keeps it), so it is
 * a workable handle. Lines that do not resolve are returned rather than thrown
 * on, because the two callers want opposite things from a failure and neither
 * wants an exception.
 *
 * A blank size or colour is stored by omitting the field rather than as "", and
 * no live variant has an empty label, so an omitted field simply matches nothing
 * — the same outcome as a deleted variant, which is correct.
 */
export async function resolveOrderLines(
  items: OrderItem[],
): Promise<{ lines: StockLine[]; unresolved: OrderItem[] }> {
  const lines: StockLine[] = [];
  const unresolved: OrderItem[] = [];

  for (const item of items) {
    if (!item.href) {
      unresolved.push(item);
      continue;
    }
    const doc = await getProductByHref(item.href);
    if (!doc) {
      unresolved.push(item);
      continue;
    }
    const color = (item.color ?? "").trim().toLowerCase();
    const size = (item.size ?? "").trim().toLowerCase();
    const variant = (doc.variants ?? []).find(
      (v) =>
        v.color.trim().toLowerCase() === color &&
        v.size.trim().toLowerCase() === size,
    );
    // An untracked variant resolves to nothing on purpose: it must neither be
    // deducted nor block the sale, which is what keeps pre-inventory products
    // selling exactly as they did before.
    if (!variant || !isStockTracked(variant)) {
      unresolved.push(item);
      continue;
    }
    lines.push({
      productId: doc._id,
      productName: doc.name,
      color: variant.color,
      size: variant.size,
      qty: item.qty,
    });
  }

  return { lines, unresolved };
}

/** Merge duplicate lines so one variant is only ever touched once per order. */
function coalesce(lines: StockLine[]): StockLine[] {
  const byKey = new Map<string, StockLine>();
  for (const line of lines) {
    const key = `${line.productId}|${line.color.toLowerCase()}|${line.size.toLowerCase()}`;
    const prev = byKey.get(key);
    // Two cart lines can name one variant (the cart keys on href+size+colour,
    // so a product reachable by two hrefs would split). Summing first means the
    // sufficiency check sees the true total instead of passing twice on half.
    if (prev) prev.qty += line.qty;
    else byKey.set(key, { ...line });
  }
  return [...byKey.values()];
}

async function describeShortage(line: StockLine): Promise<InsufficientStock> {
  const available = await readVariantStock(line.productId, line.color, line.size);
  return {
    name: line.productName,
    color: line.color,
    size: line.size,
    requested: line.qty,
    available: available ?? 0,
  };
}

/**
 * Deduct a whole order's stock, all-or-nothing.
 *
 * Three phases, because transactions are not available (local dev runs a
 * standalone mongod, and requiring a replica set would couple development to a
 * deployment topology for a shop doing under twenty orders a day):
 *
 *   1. PRECHECK — reject the order up front if anything is short, so the
 *      customer gets a message naming the variant. Advisory only: stock can move
 *      between this read and phase 2, which is why phase 2 re-checks atomically.
 *   2. APPLY — deduct line by line, each carrying its own guard.
 *   3. COMPENSATE — if any line fails, give back the lines already taken.
 *
 * The window this leaves: between the first and last deduction, a concurrent
 * order can see stock that is about to be returned. The worst case is a spurious
 * "sold out" for an order that would have fit — never an oversell, never a
 * negative balance. It is milliseconds wide and needs two orders for overlapping
 * variants inside it.
 */
export async function reserveStockForOrder(
  items: OrderItem[],
  orderId?: string,
): Promise<ReserveResult> {
  const { lines: rawLines, unresolved } = await resolveOrderLines(items);
  const lines = coalesce(rawLines);

  // Phase 1 — precheck, so a short order is refused before anything moves.
  const shortages: InsufficientStock[] = [];
  for (const line of lines) {
    const available = await readVariantStock(line.productId, line.color, line.size);
    if (available === null || available < line.qty) {
      shortages.push(await describeShortage(line));
    }
  }
  if (shortages.length > 0) return { ok: false, shortages };

  // Phase 2 — apply.
  const applied: StockLine[] = [];
  for (const line of lines) {
    const ok = await applyVariantDelta(
      line.productId,
      line.color,
      line.size,
      -line.qty,
    );
    if (ok) {
      applied.push(line);
      continue;
    }

    // Phase 3 — compensate. These increments are unconditional and touch only
    // variants we deducted moments ago, so the units are provably there; they
    // cannot fail for a stock reason.
    for (const done of applied) {
      await applyVariantDelta(done.productId, done.color, done.size, done.qty);
    }
    return { ok: false, shortages: [await describeShortage(line)] };
  }

  await logOrderMovements(applied, "sale", orderId);
  return { ok: true, applied, skipped: unresolved };
}

/**
 * Give an order's stock back. Unconditional — restoring cannot make stock invalid.
 *
 * Lines that no longer resolve are reported, not treated as failures: a product
 * deleted after its order was placed must not make that order un-cancellable.
 */
export async function restoreStockForOrder(
  items: OrderItem[],
  orderId?: string,
  reason: StockReason = "cancel",
): Promise<{ restored: StockLine[]; unmatched: OrderItem[] }> {
  const { lines: rawLines, unresolved } = await resolveOrderLines(items);
  const lines = coalesce(rawLines);
  const restored: StockLine[] = [];

  for (const line of lines) {
    const ok = await applyVariantDelta(
      line.productId,
      line.color,
      line.size,
      line.qty,
    );
    if (ok) restored.push(line);
  }

  await logOrderMovements(restored, reason, orderId);
  return { restored, unmatched: unresolved };
}

/** Ledger rows for a batch of order-driven movements. */
async function logOrderMovements(
  lines: StockLine[],
  reason: StockReason,
  orderId?: string,
): Promise<void> {
  const outbound = reason === "sale" || reason === "recancel";
  for (const line of lines) {
    const after = await readVariantStock(line.productId, line.color, line.size);
    await recordMovement({
      productId: line.productId,
      productName: line.productName,
      color: line.color,
      size: line.size,
      delta: outbound ? -line.qty : line.qty,
      stockAfter: after ?? 0,
      reason,
      ...(orderId ? { orderId } : {}),
    });
  }
}

/**
 * Add stock to one variant (nhập kho) or correct it (điều chỉnh).
 *
 * A restock is expressed as a delta rather than a new absolute value so two
 * people entering deliveries at once add up instead of overwriting each other.
 * Manual stocktake corrections go through `setVariantStock`, which is the only
 * place an absolute number is legitimate.
 */
export async function restockVariant(params: {
  productId: string;
  color: string;
  size: string;
  qty: number;
  costPrice?: number;
  note?: string;
  reason?: StockReason;
}): Promise<{ ok: boolean; stockAfter: number | null }> {
  const { productId, color, size, qty } = params;
  if (!Number.isFinite(qty) || qty === 0) return { ok: false, stockAfter: null };

  const col = await productsCollection();
  const current = await readVariantStock(productId, color, size);

  // First-ever restock: the variant has no `stock` field, so `$inc` has nothing
  // to add to and the guarded update would not match. Seed it instead — this is
  // the moment a variant starts being tracked.
  if (current === null) {
    if (qty < 0) return { ok: false, stockAfter: null };
    const seeded = await col.updateOne(
      { _id: new ObjectId(productId) },
      { $set: { "variants.$[v].stock": qty }, $inc: { totalStock: qty } },
      { arrayFilters: [{ "v.color": ci(color), "v.size": ci(size) }] },
    );
    if (seeded.modifiedCount !== 1) return { ok: false, stockAfter: null };
  } else {
    const ok = await applyVariantDelta(productId, color, size, qty);
    if (!ok) return { ok: false, stockAfter: current };
  }

  const stockAfter = await readVariantStock(productId, color, size);
  const doc = await col.findOne({ _id: new ObjectId(productId) });
  await recordMovement({
    productId,
    productName: String(doc?.name ?? ""),
    color,
    size,
    delta: qty,
    stockAfter: stockAfter ?? 0,
    reason: params.reason ?? "restock",
    ...(params.costPrice !== undefined ? { costPrice: params.costPrice } : {}),
    ...(params.note ? { note: params.note } : {}),
  });
  return { ok: true, stockAfter };
}

/** Variants at or below their alert threshold. */
export async function listLowStockVariants(): Promise<
  { product: ProductDoc; variant: ProductVariant }[]
> {
  const col = await productsCollection();
  // Only products with something tracked can be low; the rest have no answer.
  const docs = await col.find({ totalStock: { $exists: true } }).toArray();
  const out: { product: ProductDoc; variant: ProductVariant }[] = [];
  for (const raw of docs) {
    const { _id, ...rest } = raw;
    const product = { _id: String(_id), ...(rest as Omit<ProductDoc, "_id">) };
    for (const variant of product.variants ?? []) {
      if (!isStockTracked(variant)) continue;
      const threshold = variant.lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD;
      if ((variant.stock ?? 0) <= threshold) out.push({ product, variant });
    }
  }
  return out;
}

/** Recent ledger rows, newest first. */
export async function listStockMovements(
  limit = 50,
  productId?: string,
): Promise<StockMovementDoc[]> {
  await ensureIndexes();
  const col = await stockMovementsCollection();
  const filter: Document = productId ? { productId } : {};
  const docs = await col
    .find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
  return docs.map((d) => {
    const { _id, ...rest } = d;
    return { _id: String(_id), ...(rest as Omit<StockMovementDoc, "_id">) };
  });
}
