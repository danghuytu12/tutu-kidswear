<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Website Reverse-Engineer Template

## What This Is
A reusable template for reverse-engineering any website into a clean, modern Next.js codebase using AI coding agents. The Next.js + shadcn/ui + Tailwind v4 base is pre-scaffolded — just run `/clone-website <url1> [<url2> ...]`.

## Tech Stack
- **Framework:** Next.js 16 (App Router, React 19, TypeScript strict)
- **UI:** shadcn/ui (Radix primitives, Tailwind CSS v4, `cn()` utility)
- **Icons:** Lucide React (default — will be replaced/supplemented by extracted SVGs)
- **Styling:** Tailwind CSS v4 with oklch design tokens
- **Deployment:** Vercel

## Monorepo (Turborepo + npm workspaces)
Two Next.js apps share a UI package:
- `apps/user` — the public storefront (cocandy clone), dev on **:3000**
- `apps/admin` — the admin dashboard, dev on **:3001**
- `packages/ui` (`@repo/ui`) — shared components, icons, design tokens (`globals.css`), `lib` (utils, products, navigation, types)

## Commands (run from repo root; Turbo fans out to workspaces)
- `npm run dev` — start both apps · `npm run dev:user` / `npm run dev:admin` — one app
- `npm run build` — build all · `npm run typecheck` · `npm run lint`
- `npm run check` — lint + typecheck + build across the monorepo

Imports: shared code via `@repo/ui/...` (e.g. `@repo/ui/components/SiteHeader`, `@repo/ui/lib/products`); app-local code via `@/...`. Each app `transpilePackages: ["@repo/ui"]` and its `globals.css` imports `@repo/ui/globals.css` for the shared tokens.

## Code Style
- TypeScript strict mode, no `any`
- Named exports, PascalCase components, camelCase utils
- Tailwind utility classes, no inline styles
- 2-space indentation
- Responsive: mobile-first

## Design Principles
- **Pixel-perfect emulation** — match the target's spacing, colors, typography exactly
- **No personal aesthetic changes during emulation phase** — match 1:1 first, customize later
- **Real content** — use actual text and assets from the target site, not placeholders
- **Beauty-first** — every pixel matters

## Project Structure
```
apps/
  user/             # Public storefront (Next.js app)
    src/app/        # Routes: /, /products/[slug], /checkout, /categories/[slug]
    src/components/ # App-local sections (home/, pdp/, checkout/, category/)
    public/         # images/, videos/, seo/ (downloaded assets)
  admin/            # Admin dashboard (Next.js app)
    src/app/        # Routes: /, /products, /orders, /customers, /settings
    src/components/ # AdminSidebar, AdminTopbar, PagePlaceholder
    public/         # shared brand assets (logo, favicon)
packages/
  ui/               # @repo/ui — shared workspace package
    src/components/ # Shared UI: SiteHeader/Footer, ProductCard/Carousel/Grid, ui/, icons.tsx
    src/lib/        # utils.ts (cn), products.ts, navigation.ts, types.ts
    src/globals.css # Shared design tokens, theme, utilities
turbo.json          # Turborepo pipeline
tsconfig.base.json  # Shared TS config (apps/packages extend this)
docs/
  research/         # Inspection output (design tokens, components, layout)
  design-references/ # Screenshots and visual references
scripts/            # Asset download scripts
```

## MOST IMPORTANT NOTES
- When launching Claude Code agent teams, ALWAYS have each teammate work in their own worktree branch and merge everyone's work at the end, resolving any merge conflicts smartly since you are basically serving the orchestrator role and have full context to our goals, work given, work achieved, and desired outcomes.
- After editing `AGENTS.md`, run `bash scripts/sync-agent-rules.sh` to regenerate platform-specific instruction files.
- After editing `.claude/skills/clone-website/SKILL.md`, run `node scripts/sync-skills.mjs` to regenerate the skill for all platforms.

@docs/research/INSPECTION_GUIDE.md
