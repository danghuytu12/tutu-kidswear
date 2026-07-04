// One-time migration: mark every existing order as read so the notification
// badge starts at 0. New orders created after this run carry read:false.
// Run once:  node scripts/mark-legacy-orders-read.mjs
import { MongoClient } from "mongodb";
import { readFileSync } from "node:fs";

const env = readFileSync("apps/admin/.env.local", "utf8");
const uri = (env.match(/MONGODB_URI=(.+)/) || [])[1]?.trim();
if (!uri) {
  console.error("MONGODB_URI not found in apps/admin/.env.local");
  process.exit(1);
}

const client = new MongoClient(uri);
await client.connect();
const res = await client
  .db("cocandy")
  .collection("orders")
  .updateMany({ read: { $ne: true } }, { $set: { read: true } });
console.log(`Marked ${res.modifiedCount} legacy orders as read.`);
await client.close();
