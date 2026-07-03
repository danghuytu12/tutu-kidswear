// Seed the shared MongoDB `products` collection from the static catalog in
// packages/ui/src/lib/products.ts. Idempotent: upserts by `href`.
//
// Usage:
//   MONGODB_URI="mongodb+srv://user:pass@cluster0.../" MONGODB_DB=cocandy \
//     node scripts/seed-db.mjs
//
// Requires Node 24+ (native TypeScript import stripping) — this repo's engines
// field already pins node >=24.

import { MongoClient } from "mongodb";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readFileSync, existsSync } from "node:fs";

const here = dirname(fileURLToPath(import.meta.url));

// Load MONGODB_* from the first .env.local found (root, then each app), unless
// they are already set in the environment. Minimal parser (KEY=VALUE per line).
function loadEnvLocal() {
  const candidates = [
    join(here, "../.env.local"),
    join(here, "../apps/admin/.env.local"),
    join(here, "../apps/user/.env.local"),
  ];
  for (const file of candidates) {
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const key = m[1];
      let val = m[2].trim().replace(/^["']|["']$/g, "");
      if (!process.env[key] && val) process.env[key] = val;
    }
  }
}

loadEnvLocal();

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB ?? "cocandy";

if (!uri) {
  console.error(
    "MONGODB_URI is not set. Example:\n  MONGODB_URI='mongodb+srv://user:pass@cluster0.../' node scripts/seed-db.mjs",
  );
  process.exit(1);
}

const productsModulePath = join(here, "../packages/ui/src/lib/products.ts");

// Node imports the .ts module directly (needs --experimental-strip-types on
// Node 22, native on Node 24+). Use `npm run seed`, which passes the flag.
const mod = await import(productsModulePath);

// Collect every exported Product[] array, dedupe by href.
const byHref = new Map();
for (const value of Object.values(mod)) {
  if (Array.isArray(value)) {
    for (const p of value) {
      if (p && typeof p === "object" && "href" in p && "name" in p) {
        byHref.set(p.href, p);
      }
    }
  }
}

// Parse a formatted VND price like "279.650 ₫" -> 279650.
function parsePrice(s) {
  if (typeof s !== "string") return 0;
  const digits = s.replace(/[^\d]/g, "");
  return digits ? Number(digits) : 0;
}

// Rough category from the Vietnamese product name.
function categoryOf(name) {
  const n = name.toLowerCase();
  if (n.includes("bơi")) return "Đồ bơi";
  if (n.includes("váy")) return "Váy";
  if (n.includes("chân váy")) return "Chân váy";
  if (n.includes("áo")) return "Áo";
  if (n.includes("bộ")) return "Set bộ";
  return "Khác";
}

const now = new Date().toISOString();
const docs = [...byHref.values()].map((p) => ({
  name: p.name,
  href: p.href,
  img: p.img,
  sale: p.sale,
  orig: p.orig,
  disc: p.disc,
  category: categoryOf(p.name),
  brand: "COCANDY",
  price: parsePrice(p.sale),
  inStock: true,
  createdAt: now,
}));

const client = new MongoClient(uri);
try {
  await client.connect();
  const col = client.db(dbName).collection("products");
  let upserts = 0;
  for (const doc of docs) {
    const res = await col.updateOne(
      { href: doc.href },
      { $set: doc },
      { upsert: true },
    );
    if (res.upsertedCount || res.modifiedCount) upserts += 1;
  }
  console.log(
    `Seeded ${docs.length} products (${upserts} inserted/updated) into ${dbName}.products`,
  );
} finally {
  await client.close();
}
