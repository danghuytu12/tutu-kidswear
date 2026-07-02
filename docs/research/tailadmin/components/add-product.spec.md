# Add Product Page Specification

## Overview
- **Target file:** `apps/admin/src/app/add-product/page.tsx` (new route)
- **Screenshot:** `docs/design-references/tailadmin/add-product-desktop.png`
- **Interaction model:** static form (cosmetic controls; stock stepper cosmetic)
- **Shell:** inside existing admin layout. Covers only `<main>` content.

## Layout
Root: `<div className="mx-auto max-w-[1536px]">`.
1. **Page header row** — flex justify-between: `<h1>Add Products</h1>` (left) + breadcrumb `Home > Add Products` (right). Same styling as products-list header (title `text-xl font-semibold text-[#1D2939]`; breadcrumb `text-sm`, Home #667085, current #1D2939, ChevronRight h-4 w-4).
2. **Form body** — `space-y-6`, three cards stacked, then a footer button row.

## Shared field primitives
- **Label:** `mb-1.5 block text-sm font-medium text-gray-700` (14px/500, #344054). (Stock Quantity label uses `mb-1 inline-block text-sm font-semibold text-gray-700`.)
- **Text/number input:** `h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-sm placeholder:text-gray-400 focus:border-[#465FFF]/40 focus:outline-none focus:ring-3 focus:ring-[#465FFF]/20` (h 44px, border #D0D5DD radius 8px, text #1D2939, placeholder #98A2B3).
- **Select:** `h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-11 text-sm text-gray-400 shadow-sm focus:border-[#465FFF]/40 focus:outline-none focus:ring-3 focus:ring-[#465FFF]/10` + a `ChevronDown` (lucide h-5 w-5 text-gray-500) absolutely positioned right-4 top-1/2 -translate-y-1/2. Placeholder option shows in gray-400.
- **Textarea:** `w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-sm placeholder:text-gray-400 focus:border-[#465FFF]/40 focus:outline-none focus:ring-3 focus:ring-[#465FFF]/10` with `rows={6}`.

## Card wrapper primitive
`rounded-2xl border border-gray-200 bg-white` (radius 16px, border #E4E7EC).
- Header: `<div className="border-b border-gray-200 px-6 py-4"><h3 className="text-lg font-medium text-gray-800">TITLE</h3></div>` (18px/500, #1D2939).
- Body: `<div className="p-6">…fields…</div>` (padding 24px).

## Card 1 — "Products Description"
Body fields:
- Grid `grid grid-cols-1 gap-5 md:grid-cols-2`:
  - **Product Name** — text input, placeholder `Enter product name`.
  - **Category** — select, placeholder `Select a category`. Options: Laptop, Phone, Watch, Electronics, Accessories.
- Grid `grid grid-cols-1 gap-5 md:grid-cols-2` (mt-5 via space or gap from parent — wrap all field-groups in the body with `space-y-5`):
  - **Brand** — select, placeholder `Select brand`. Options: Apple, Samsung, LG.
  - **Color** — select, placeholder `Select color`. Options: Silver, Black, White, Gray.
- Grid `grid grid-cols-1 gap-5 md:grid-cols-3`:
  - **Weight(KG)** — number input, placeholder `15`.
  - **Length(CM)** — number input, placeholder `120`.
  - **Width(CM)** — number input, placeholder `23`.
- **Description** — full width: label `Description`, textarea placeholder `Receipt Info (optional)`, rows=6.

Recommend body layout: `<div className="p-6 space-y-5">` containing each grid/field block.

## Card 2 — "Pricing & Availability"
Body `p-6 space-y-5`:
- Grid `grid grid-cols-1 gap-5 md:grid-cols-3`:
  - **Weight(KG)** placeholder `15`; **Length(CM)** placeholder `120`; **Width(CM)** placeholder `23`. (same as card 1's dimension row)
- Grid `grid grid-cols-1 gap-5 sm:grid-cols-2`:
  - **Stock Quantity** — label `mb-1 inline-block text-sm font-semibold text-gray-700`; control is a stepper:
    `<div className="flex h-11 divide-x divide-gray-300 overflow-hidden rounded-lg border border-gray-300">`
      - minus button `inline-flex h-11 w-11 items-center justify-center bg-white text-gray-700 hover:bg-gray-100` → lucide `Minus` (h-5 w-5).
      - input `h-11 w-full border-0 bg-transparent px-3 text-center text-sm text-gray-800 focus:outline-none` (no visible placeholder; empty).
      - plus button same as minus → lucide `Plus` (h-5 w-5).
  - **Availability Status** — select, placeholder `Select a Availability`. Options: In Stock, Out of Stock.

## Card 3 — "Products Images"
Body `p-6`:
- Dropzone: `<div className="shadow-sm block cursor-pointer rounded-lg border-2 border-dashed border-gray-300 transition hover:border-[#465FFF]">` with inner `flex flex-col items-center justify-center px-6 py-16 text-center` (roughly — height ~ matches screenshot big zone; use py-14/py-16).
  - Icon circle: `inline-flex h-13 w-13 items-center justify-center rounded-full border border-gray-200 text-gray-700` (52px). Use `h-[52px] w-[52px]`. Inside: lucide `Upload` (h-5 w-5) — arrow-up-from-tray style; lucide `UploadCloud` or `Upload` acceptable (screenshot shows an upload/tray arrow — use `Upload`).
  - Text block mt-4, `text-center text-sm text-gray-500`:
    `<span className="font-medium text-gray-800">Click to upload</span>` + ` or drag and drop SVG, PNG, JPG or GIF (MAX. 800x400px)`.

## Footer button row
`flex items-center justify-end gap-3 pt-2` (below the cards, still inside space-y-6 or separate):
- **Draft** — `inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3.5 text-sm font-medium bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50`.
- **Publish Product** — `inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3.5 text-sm font-medium text-white bg-[#465FFF] shadow-sm hover:bg-[#3641F5]`.

## Responsive
- **Desktop (≥768px):** 2-col and 3-col grids as specified.
- **Mobile (<768px):** all grids collapse to `grid-cols-1`. Footer buttons remain right-aligned but may wrap.

## Assets / Icons (lucide-react)
`ChevronRight`, `ChevronDown`, `Minus`, `Plus`, `Upload`.

## Notes for builder
- Static page. Selects can be plain `<select>` with a placeholder option (`<option value="" disabled selected hidden>`), OR a styled div — but a real `<select>` with appearance-none + absolute ChevronDown is simplest and matches. Since a native select needs client interactivity to show gray placeholder, using `defaultValue=""` on a `<select>` with a disabled placeholder option keeps it a server component. Keep it a server component (no "use client").
- The stock stepper +/- buttons are cosmetic `type="button"` (no onClick needed). Keep server component.
- Do not set font-family; inherits Outfit from layout.
