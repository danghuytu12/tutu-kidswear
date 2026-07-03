import { MongoClient, type Db } from "mongodb";
import { MONGODB_DB, requireMongoUri } from "./config";

// Serverless-safe singleton: cache the connect promise on globalThis so warm
// Vercel invocations reuse a single connection pool instead of opening a new one
// per request (which would exhaust the Atlas connection limit). The connection is
// LAZY — nothing connects until getDb() is first awaited at runtime, so `next build`
// never touches the network.

type GlobalWithMongo = typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
};

const globalWithMongo = globalThis as GlobalWithMongo;

function getClientPromise(): Promise<MongoClient> {
  if (!globalWithMongo._mongoClientPromise) {
    const client = new MongoClient(requireMongoUri());
    globalWithMongo._mongoClientPromise = client.connect();
  }
  return globalWithMongo._mongoClientPromise;
}

/** Get the shared database handle. Connects on first use. */
export async function getDb(): Promise<Db> {
  const client = await getClientPromise();
  return client.db(MONGODB_DB);
}
