# Shared MongoDB (admin + user)

Both apps share one MongoDB Atlas database through a data layer in
`@repo/ui` (`packages/ui/src/lib/db`). Apps talk to it only server-side via their
own Route Handlers under `/api`.

## Environment variables

Create a `.env.local` file (git-ignored) at the repo root **and** inside each app
(`apps/user/.env.local`, `apps/admin/.env.local`) — Next.js reads `.env.local`
from the app directory. Set:

```
# Full SRV string with the REAL password (percent-encode special chars: @ : / ? # [ ] %)
MONGODB_URI=mongodb+srv://danghuytuthd2006_db_user:YOUR_PASSWORD@cluster0.qlpyxoo.mongodb.net/

# Database name inside the cluster (defaults to "cocandy" if omitted)
MONGODB_DB=cocandy
```

> Your Atlas string had a `<db_password>` placeholder — replace it with the real
> password. If the password contains `@ : / ? # [ ] %`, percent-encode it
> (e.g. `@` → `%40`).

## Vercel

Set `MONGODB_URI` and `MONGODB_DB` as **Environment Variables** on BOTH Vercel
projects (user and admin), for the Production + Preview environments. No secret is
committed to Git; the build connects lazily at runtime only.

Atlas → **Network Access** must allow Vercel egress. Simplest: allow
`0.0.0.0/0` (any IP). Tighten later if needed.

## Empty-first behavior

By design the DB starts **empty**. Products are created from the admin
(`/add-product`). Fallback rules:

- **Admin `/products`**: empty DB → shows an empty state ("Chưa có sản phẩm
  nào…"), NOT demo rows. Demo rows appear only if the DB is unreachable/errors.
- **User `/categories/[slug]`**: empty DB → falls back to the static catalog
  (`saleHeThuProducts`). Once products exist in the DB, it shows those instead.

## Seeding (optional)

If you ever want to pre-fill the catalog with the static products instead of
starting empty:

```
npm run seed
```

The script auto-loads `MONGODB_URI` / `MONGODB_DB` from `.env.local` (root or
either app) and passes `--experimental-strip-types` for Node 22. Safe to re-run:
it upserts by `href`, so it won't create duplicates. Skip this to keep the DB
empty and build the catalog from the admin.

## Collections

- `products` — shared catalog (admin CRUD, user read)
- `orders` — created at checkout (user), listed in admin
- `customers` — listed in admin

## API endpoints

Admin (`apps/admin`):
- `GET/POST /api/products`, `GET/PUT/DELETE /api/products/[id]`
- `GET /api/orders`
- `GET /api/customers`

User (`apps/user`):
- `GET /api/products`
- `POST /api/orders`

## Telegram order notifications

Set these on the user app (`apps/user/.env.local`) and Vercel (user project):

```
TELEGRAM_BOT_TOKEN=...   # from @BotFather
TELEGRAM_CHAT_ID=...      # your chat/group id
```

On checkout the order is saved to MongoDB (shows in admin) and then sent to the
Telegram chat. If the vars are unset or the send fails, the order is still saved
and the customer still sees success.

## Cart

The storefront cart lives in the browser (React Context + `localStorage`, key
`cocandy-cart`) — no server storage, no login. Add-to-cart is wired on product
cards and the product detail page; the header badge shows the live count. On
checkout the cart contents + customer fields become the order.
