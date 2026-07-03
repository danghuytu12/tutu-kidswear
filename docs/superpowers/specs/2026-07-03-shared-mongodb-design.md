# Shared MongoDB for admin + user — Design

Date: 2026-07-03

## Goal
A single NoSQL database (MongoDB Atlas) shared by both the `user` storefront and
the `admin` dashboard. All connection code lives in-source (in `@repo/ui`), the
connection string is read from `process.env.MONGODB_URI`, and the apps build and
run on Vercel unchanged.

## Provider & config
- **MongoDB Atlas** (free tier), official `mongodb` Node driver (no ODM).
- Connection string: `process.env.MONGODB_URI`. DB name: `process.env.MONGODB_DB`
  (default `cocandy`). Configured locally in `.env.local` (git-ignored) and on
  Vercel via Environment Variables. `.env.example` documents both keys.
- No secret committed to Git.

## Architecture
Shared data layer in `packages/ui/src/lib/db/`, consumed only server-side via each
app's Route Handlers.

```
packages/ui/src/lib/db/
  config.ts        MONGODB_URI + DB name (env-driven)
  client.ts        MongoClient singleton cached on globalThis (serverless-safe, lazy connect)
  collections.ts   typed collection getters
  types.ts         ProductDoc, OrderDoc, CustomerDoc
  repositories/
    products.ts    listProducts / getProductById / createProduct / updateProduct / deleteProduct + toStorefrontProduct mapper
    orders.ts      listOrders / createOrder
    customers.ts   listCustomers / createCustomer

apps/admin/src/app/api/
  products/route.ts        GET list, POST create
  products/[id]/route.ts   GET one, PUT update, DELETE
  orders/route.ts          GET list
  customers/route.ts       GET list

apps/user/src/app/api/
  products/route.ts        GET list (read-only)
  orders/route.ts          POST create (checkout)
```

`@repo/ui` package `exports` gains `./lib/db/*` → `./src/lib/db/*.ts` and
`./lib/db/repositories/*` → `./src/lib/db/repositories/*.ts`.

## Serverless connection pattern (Vercel-critical)
- `client.ts` caches `new MongoClient(uri).connect()` promise on `globalThis` so
  warm invocations reuse one pool; **connect is lazy** — only when a handler runs,
  never at build time.
- Every DB Route Handler: `export const runtime = "nodejs"` and
  `export const dynamic = "force-dynamic"`.
- Both apps add `mongodb` to `dependencies` and set
  `serverExternalPackages: ["mongodb"]` in `next.config.ts` so the native driver
  is not bundled.
- Atlas Network Access must allow Vercel egress (`0.0.0.0/0` for simplicity).

## Data model
- `Product` (existing storefront type) stays untouched. `ProductDoc` extends it:
  `{ ...Product, _id, category, brand, price:number, inStock:boolean, createdAt:string }`.
  Repositories expose `toStorefrontProduct(doc)` so existing UI components
  (`ProductCard`, `ProductGrid`) keep working.
- `OrderDoc`: `{ _id, items: {name,price,qty}[], total, customerName, customerEmail, status, createdAt }`.
- `CustomerDoc`: `{ _id, name, email, createdAt }`.

## Seeding & fallback
- `scripts/seed-db.mjs` loads the current static products (`packages/ui/src/lib/products.ts`)
  into the `products` collection. Run manually: `MONGODB_URI=... node scripts/seed-db.mjs`.
- Static `products.ts` is NOT deleted — remains a seed source and UI fallback.

## Read integration this pass
- Admin `products-list` page reads from `/api/products` (client fetch) OR the
  admin API is available for wiring. To keep the page a fast static-ish render and
  avoid a rewrite, the products-list page is converted to fetch from the DB via a
  server component calling the repository directly (admin is server-side, safe).
  If the DB is empty/unreachable it falls back to the static catalog so the page
  never breaks.

## Error handling
- Route Handlers wrap DB calls in try/catch → `{ error: string }` + status 500.
  Never echo the connection string in errors.

## Out of scope (YAGNI)
- Auth, pagination, realtime, Mongoose/ODM.
- Wiring admin add/edit forms to POST/PUT (endpoints are built; form submission
  wiring is a follow-up). Storefront checkout → POST /api/orders wiring is a
  follow-up; the endpoint is built.

## Verification
- `npm run build` passes with NO database reachable at build time (lazy connect).
- Typecheck clean across workspaces.
