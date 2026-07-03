// Central MongoDB configuration. The connection string and DB name are read from
// environment variables so no secret is committed to Git:
//   - Local: set MONGODB_URI / MONGODB_DB in .env.local (git-ignored)
//   - Vercel: set them as Environment Variables on each project
// See docs/DATABASE.md for setup.

export const MONGODB_URI = process.env.MONGODB_URI ?? "";
export const MONGODB_DB = process.env.MONGODB_DB ?? "cocandy";

/** Throw a clear error only when the DB is actually used (never at build time). */
export function requireMongoUri(): string {
  if (!MONGODB_URI) {
    throw new Error(
      "MONGODB_URI is not set. Add it to .env.local (local) or Vercel Environment Variables. See docs/DATABASE.md.",
    );
  }
  return MONGODB_URI;
}
