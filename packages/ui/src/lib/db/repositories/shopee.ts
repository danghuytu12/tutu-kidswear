import { ObjectId, type Document } from "mongodb";
import { shopeeImportsCollection, shopeeOrderRowsCollection } from "../collections";
import type { ShopeeImportDoc } from "../types";
import type { ParsedShopeeRow } from "../../shopee/map";
import type { FilenameRange } from "../../shopee/filename";

/**
 * Order statuses that must not count towards revenue.
 *
 * Matched case-insensitively against column D. The exact strings Shopee emits
 * are unverified (the sample export we designed against has no data rows), so
 * the Shopee page renders a status breakdown — the first real import will show
 * the true values, and only this constant needs correcting if they differ.
 */
const CANCELLED_STATUS_PATTERNS = ["hủy", "huỷ", "cancel"];

/** Mongo predicate excluding cancelled orders from an aggregation. */
const NOT_CANCELLED = {
  status: {
    $not: new RegExp(CANCELLED_STATUS_PATTERNS.join("|"), "i"),
  },
};

/** Rows per insertMany call, so a large export cannot exceed the 16MB command limit. */
const INSERT_CHUNK = 1000;

function toImportDoc(doc: Document): ShopeeImportDoc {
  const { _id, ...rest } = doc;
  return { _id: String(_id), ...(rest as Omit<ShopeeImportDoc, "_id">) };
}

// createIndex is idempotent; the flag keeps it to one round-trip per warm
// instance. Called only from the write path, so page renders never pay for it.
let indexesEnsured = false;

async function ensureIndexes(): Promise<void> {
  if (indexesEnsured) return;
  const rows = await shopeeOrderRowsCollection();
  await Promise.all([
    // Serves both the report's range filter and the per-day overwrite delete.
    rows.createIndex({ orderDayKey: 1 }),
    // Serves the group-by that dedupes order-level money across line items.
    rows.createIndex({ orderCode: 1 }),
    // Serves cascade-delete of a single import.
    rows.createIndex({ importId: 1 }),
  ]);
  indexesEnsured = true;
}

export interface ImportShopeeResult {
  importId: string;
  rowCount: number;
  orderCount: number;
  replacedRowCount: number;
  totalRevenue: number;
  /** Rows parsed but discarded because their date fell outside the filename range. */
  outOfRangeCount: number;
}

/**
 * Replace the stored rows for a filename's day range with the rows from that file.
 *
 * Re-uploading the same file is always safe: deleting the whole day range and
 * re-inserting is idempotent, so repeated imports converge on the same state
 * rather than accumulating duplicates. That property is what lets this run
 * without a Mongo transaction — which would also be unavailable against a
 * standalone mongod in local development.
 *
 * If the process dies between the delete and the insert, the range reads as
 * zero revenue — visibly wrong rather than subtly wrong — and re-uploading the
 * file restores it completely.
 */
export async function importShopeeRows(params: {
  filename: string;
  range: FilenameRange;
  fileSize: number;
  rows: ParsedShopeeRow[];
}): Promise<ImportShopeeResult> {
  const { filename, range, fileSize } = params;
  await ensureIndexes();

  // Keep only rows the filename claims to cover. Without this a mislabelled
  // file would clear days D1..D2 and then store rows for other days, which the
  // next import of those days could not clean up — double-counting for good.
  const rows = params.rows.filter(
    (r) => r.orderDayKey >= range.from && r.orderDayKey <= range.to,
  );
  const outOfRangeCount = params.rows.length - rows.length;

  const importedAt = new Date().toISOString();
  const importsCol = await shopeeImportsCollection();

  // Insert metadata first so its _id can stamp the rows; counters are filled in
  // at the end, once we know what actually landed.
  const meta = await importsCol.insertOne({
    filename,
    rangeFrom: range.from,
    rangeTo: range.to,
    fileSize,
    rowCount: 0,
    orderCount: 0,
    replacedRowCount: 0,
    totalRevenue: 0,
    importedAt,
  });
  const importId = String(meta.insertedId);

  const rowsCol = await shopeeOrderRowsCollection();
  const deleted = await rowsCol.deleteMany({
    orderDayKey: { $gte: range.from, $lte: range.to },
  });
  const replacedRowCount = deleted.deletedCount ?? 0;

  for (let i = 0; i < rows.length; i += INSERT_CHUNK) {
    const chunk = rows.slice(i, i + INSERT_CHUNK).map((r) => ({ ...r, importId, importedAt }));
    await rowsCol.insertMany(chunk, { ordered: false });
  }

  const orderCount = new Set(rows.map((r) => r.orderCode)).size;
  const totalRevenue = sumDedupedRevenue(rows);

  await importsCol.updateOne(
    { _id: meta.insertedId },
    { $set: { rowCount: rows.length, orderCount, replacedRowCount, totalRevenue } },
  );

  return {
    importId,
    rowCount: rows.length,
    orderCount,
    replacedRowCount,
    totalRevenue,
    outOfRangeCount,
  };
}

/** Sum buyerPaidTotal once per order, skipping cancellations. */
function sumDedupedRevenue(rows: ParsedShopeeRow[]): number {
  const rx = new RegExp(CANCELLED_STATUS_PATTERNS.join("|"), "i");
  const perOrder = new Map<string, number>();
  for (const r of rows) {
    if (rx.test(r.status)) continue;
    if (!perOrder.has(r.orderCode)) perOrder.set(r.orderCode, r.buyerPaidTotal);
  }
  let sum = 0;
  for (const v of perOrder.values()) sum += v;
  return sum;
}

export interface ShopeeSummary {
  revenue: number;
  orderCount: number;
  rowCount: number;
}

/**
 * Revenue over an inclusive day range, cancellations excluded.
 *
 * Two grouping stages, and both are necessary: buyerPaidTotal is an order-level
 * figure repeated on every line-item row, so summing it across rows directly
 * would multiply revenue by the number of items per order. The first stage
 * collapses each order to a single amount; only then does the second sum.
 */
export async function getShopeeSummary(
  from: string,
  to: string,
): Promise<ShopeeSummary> {
  const col = await shopeeOrderRowsCollection();
  const [result] = await col
    .aggregate([
      { $match: { orderDayKey: { $gte: from, $lte: to }, ...NOT_CANCELLED } },
      {
        $group: {
          _id: "$orderCode",
          // Safe because every row of an order carries the identical total.
          buyerPaidTotal: { $first: "$buyerPaidTotal" },
          rows: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: "$buyerPaidTotal" },
          orderCount: { $sum: 1 },
          rowCount: { $sum: "$rows" },
        },
      },
    ])
    .toArray();

  return {
    revenue: result?.revenue ?? 0,
    orderCount: result?.orderCount ?? 0,
    rowCount: result?.rowCount ?? 0,
  };
}

export interface ShopeeDailyRevenue {
  date: string;
  orders: number;
  revenue: number;
}

/** Revenue per day over the range, oldest first. Deduped per order, as above. */
export async function getShopeeDailyRevenue(
  from: string,
  to: string,
): Promise<ShopeeDailyRevenue[]> {
  const col = await shopeeOrderRowsCollection();
  const docs = await col
    .aggregate([
      { $match: { orderDayKey: { $gte: from, $lte: to }, ...NOT_CANCELLED } },
      {
        $group: {
          _id: { day: "$orderDayKey", code: "$orderCode" },
          buyerPaidTotal: { $first: "$buyerPaidTotal" },
        },
      },
      {
        $group: {
          _id: "$_id.day",
          revenue: { $sum: "$buyerPaidTotal" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ])
    .toArray();

  return docs.map((d) => ({
    date: String(d._id),
    orders: d.orders as number,
    revenue: d.revenue as number,
  }));
}

export interface ShopeeTopProduct {
  productName: string;
  variantName: string;
  quantity: number;
  revenue: number;
}

/**
 * Best-selling products over the range.
 *
 * No dedupe here, unlike the order-level queries: each row IS a distinct line
 * item, so unitPrice × quantity is summed straight across rows.
 */
export async function getShopeeTopProducts(
  from: string,
  to: string,
  limit = 20,
): Promise<ShopeeTopProduct[]> {
  const col = await shopeeOrderRowsCollection();
  const docs = await col
    .aggregate([
      { $match: { orderDayKey: { $gte: from, $lte: to }, ...NOT_CANCELLED } },
      {
        $group: {
          _id: { name: "$productName", variant: "$variantName" },
          quantity: { $sum: "$quantity" },
          revenue: { $sum: { $multiply: ["$unitPrice", "$quantity"] } },
        },
      },
      { $sort: { revenue: -1, quantity: -1 } },
      { $limit: limit },
    ])
    .toArray();

  return docs.map((d) => ({
    productName: String(d._id?.name ?? ""),
    variantName: String(d._id?.variant ?? ""),
    quantity: d.quantity as number,
    revenue: d.revenue as number,
  }));
}

export interface ShopeeOrderSummary {
  orderCode: string;
  orderDayKey: string;
  status: string;
  buyerPaidTotal: number;
  itemCount: number;
}

/** One entry per order over the range, newest first. Cancellations included. */
export async function getShopeeOrders(
  from: string,
  to: string,
): Promise<ShopeeOrderSummary[]> {
  const col = await shopeeOrderRowsCollection();
  const docs = await col
    .aggregate([
      { $match: { orderDayKey: { $gte: from, $lte: to } } },
      {
        $group: {
          _id: "$orderCode",
          orderDayKey: { $first: "$orderDayKey" },
          status: { $first: "$status" },
          buyerPaidTotal: { $first: "$buyerPaidTotal" },
          itemCount: { $sum: "$quantity" },
        },
      },
      { $sort: { orderDayKey: -1, _id: -1 } },
    ])
    .toArray();

  return docs.map((d) => ({
    orderCode: String(d._id),
    orderDayKey: d.orderDayKey as string,
    status: d.status as string,
    buyerPaidTotal: d.buyerPaidTotal as number,
    itemCount: d.itemCount as number,
  }));
}

export interface ShopeeStatusCount {
  status: string;
  orders: number;
}

/**
 * Orders per status over the range.
 *
 * Doubles as the diagnostic that reveals the real status strings Shopee emits,
 * which is what CANCELLED_STATUS_PATTERNS has to match.
 */
export async function getShopeeStatusBreakdown(
  from: string,
  to: string,
): Promise<ShopeeStatusCount[]> {
  const col = await shopeeOrderRowsCollection();
  const docs = await col
    .aggregate([
      { $match: { orderDayKey: { $gte: from, $lte: to } } },
      { $group: { _id: { status: "$status", code: "$orderCode" } } },
      { $group: { _id: "$_id.status", orders: { $sum: 1 } } },
      { $sort: { orders: -1 } },
    ])
    .toArray();

  return docs.map((d) => ({ status: String(d._id ?? ""), orders: d.orders as number }));
}

/** Import history, newest first. */
export async function listShopeeImports(): Promise<ShopeeImportDoc[]> {
  const col = await shopeeImportsCollection();
  const docs = await col.find({}).sort({ importedAt: -1 }).toArray();
  return docs.map(toImportDoc);
}

/** Delete an import and every row it created. Returns rows removed, or null if unknown. */
export async function deleteShopeeImport(id: string): Promise<number | null> {
  if (!ObjectId.isValid(id)) return null;
  const importsCol = await shopeeImportsCollection();
  const meta = await importsCol.findOne({ _id: new ObjectId(id) });
  if (!meta) return null;

  const rowsCol = await shopeeOrderRowsCollection();
  const deleted = await rowsCol.deleteMany({ importId: id });
  await importsCol.deleteOne({ _id: new ObjectId(id) });
  return deleted.deletedCount ?? 0;
}
