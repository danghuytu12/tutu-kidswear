# Products List Page Specification

## Overview
- **Target file:** `apps/admin/src/app/products/page.tsx` (replaces existing COCANDY products page)
- **Screenshot:** `docs/design-references/tailadmin/products-list-desktop.png`
- **Interaction model:** static (table render + cosmetic controls)
- **Shell:** rendered inside existing admin layout (AdminSidebar + AdminTopbar kept). This spec covers ONLY the `<main>` content.

## Layout
Root: `<div className="mx-auto max-w-[1536px]">` — remove admin default max-w-6xl wrapper here.
Two stacked blocks:
1. **Page header row** — flex justify-between: left = `<h1>Products</h1>`; right = breadcrumb `Home > Products`.
2. **Products List card** — the main content.

## Page header
- Title `Products`: `text-2xl font-semibold text-gray-800` → fontSize 24px? (extracted h1 was 20px/600). Use `text-xl font-semibold text-[#1D2939]` (20px, 600, line-height 28px).
- Breadcrumb: right-aligned, `text-sm`; "Home" `text-gray-500 #667085`, chevron `>`, "Products" `text-gray-800 #1D2939`. Use a small chevron-right svg (lucide `ChevronRight` h-4 w-4 text-gray-500).
- Row: `flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6`.

## Products List Card
Container: `overflow-hidden rounded-xl border border-gray-200 bg-white` (border #E4E7EC, radius 12px).

### Card header
`flex flex-col justify-between gap-5 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center`
- Left: title `<h3>Products List</h3>` = `text-lg font-semibold text-gray-800` (18px/600, #1D2939); subtitle `<p>Track your store's progress to boost your sales.</p>` = `text-sm text-gray-500` (14px, #667085), mt-1.
- Right: two buttons in a `flex items-center gap-3`:
  - **Export** button: `inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3.5 text-sm font-medium bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50`. Icon: download-ish (lucide `Download` h-4 w-4) AFTER text? In screenshot icon is to the RIGHT of "Export". Layout: text then icon.
  - **Add Product** button: `inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white bg-[#465FFF] shadow-sm hover:bg-[#3641F5]`. Icon: lucide `Plus` (h-5 w-5) BEFORE text "Add Product". Wrap in `<Link href="/add-product">`.

### Toolbar row (search + filter)
`flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between`
- **Search** input wrapper (relative): a search icon (lucide `Search` h-5 w-5 text-gray-400) absolutely positioned left-4; input `h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pl-12 pr-4 text-sm text-gray-800 placeholder:text-gray-400 focus:border-[#465FFF]/40 focus:outline-none focus:ring-3 focus:ring-[#465FFF]/10 xl:w-[430px]`. Placeholder: `Search...`.
- **Filter** button: `flex h-11 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 sm:min-w-[100px] shadow-sm`. Icon: lucide `SlidersHorizontal` (h-5 w-5) before text "Filter".

### Table
Wrapper: `overflow-x-auto`. `<table className="w-full">`.
- **thead** row: `border-b border-gray-200`. Each `<th className="px-5 py-4 text-left">` containing an inner span/button `text-sm font-medium text-gray-700` (14px, #344054) with a sort chevron pair (up/down, `ChevronsUpDown` lucide h-3.5 w-3.5 text-gray-400) after the label — EXCEPT the checkbox and Action columns.
- **Columns (in order):**
  1. Checkbox (width w-12): custom checkbox — `<span className="flex h-4 w-4 items-center justify-center rounded-sm border-[1.25px] border-gray-300 bg-transparent">` (unchecked, empty). Header has one too.
  2. `Products` (with sort chevrons)
  3. `Category` (with sort chevrons)
  4. `Brand` (with sort chevrons)
  5. `Price` (with sort chevrons)
  6. `Stock` (with sort chevrons)
  7. `Created At` (with sort chevrons)
  8. `Action` (no chevrons, header text only; cells empty)
- **tbody rows:** `<tr className="border-b border-gray-200 transition hover:bg-gray-50">` (last row still has border in original). Each `<td className="px-5 py-4 whitespace-nowrap">`.
  - **Products cell:** `flex items-center gap-3`: `<img className="h-12 w-12 rounded-md object-cover" />` (48px, radius 6px) + `<span className="text-sm font-medium text-gray-700">NAME</span>` (14px/500, #344054).
  - **Category cell:** `text-sm text-gray-500` (#667085).
  - **Brand cell:** `text-sm text-gray-500` (#667085). (matches Category styling)
  - **Price cell:** `text-sm text-gray-700` (#344054).
  - **Stock cell:** badge span `inline-flex rounded-full px-2 py-0.5 text-xs font-medium`. In Stock: `bg-green-50 text-green-700` (#ECFDF3 / #027A48). Out of Stock: `bg-red-50 text-red-700` (#FEF3F2 / #B42318).
  - **Created At cell:** `text-sm text-gray-700` (#344054).
  - **Action cell:** empty `<td>`.

### Table Data (verbatim, all 7 rows of page 1)
| img | Name | Category | Brand | Price | Stock | Created At |
|---|---|---|---|---|---|---|
| product-03.jpg | ASUS ROG Gaming Laptop | Laptop | ASUS | $2,199 | Out of Stock | 01 Dec, 2027 |
| product-01.jpg | Airpods Pro 2nd Gen | Accessories | Apple | $839 | In Stock | 29 Jun, 2027 |
| product-02.jpg | Apple Watch Ultra | Watch | Apple | $1,579 | Out of Stock | 13 Mar, 2027 |
| product-01.jpg | Bose QuietComfort Earbuds | Audio | Bose | $279 | In Stock | 18 Nov, 2027 |
| product-02.jpg | Canon EOS R5 Camera | Camera | Canon | $3,899 | In Stock | 28 Sep, 2027 |
| product-04.jpg | Dell XPS 13 Laptop | Laptop | Dell | $1,299 | In Stock | 18 Aug, 2027 |
| product-05.jpg | Google Pixel 8 Pro | Phone | Google | $899 | Out of Stock | 02 Sep, 2027 |

Images live at `/images/tailadmin/product/product-0X.jpg` in `apps/admin/public`.

### Pagination footer
`flex flex-col items-center justify-between gap-3 border-t border-gray-200 px-5 py-4 sm:flex-row`
- Left: `<p className="text-sm text-gray-500">Showing 1 to 7 of 20</p>` (#667085).
- Right: `flex items-center gap-2`:
  - Prev arrow button: `flex items-center rounded-lg border border-gray-300 bg-white p-2 text-gray-700 shadow-sm hover:bg-gray-50` (lucide `ChevronLeft` h-5 w-5).
  - Page number buttons `1 2 3`: each `flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium`. Active (`1`): `bg-[#465FFF] text-white`. Inactive (`2`,`3`): `text-gray-700 hover:bg-[#465FFF]/10`.
  - Next arrow button: same as prev (lucide `ChevronRight` h-5 w-5).

## Responsive
- **Desktop (1440px):** as above, search 430px wide.
- **Tablet/Mobile (<640px):** card header stacks (flex-col), buttons full-width-ish; toolbar stacks; table gets horizontal scroll via `overflow-x-auto`; pagination footer stacks (flex-col).

## Assets
- Product images: `/images/tailadmin/product/product-01.jpg` … `product-05.jpg`
- Icons (lucide-react): `Plus`, `Download`, `Search`, `SlidersHorizontal`, `ChevronsUpDown`, `ChevronLeft`, `ChevronRight`.

## Notes for builder
- Use `next/image` `Image` OR plain `<img>` — plain `<img>` with eslint-disable is fine (matches existing admin code).
- Font: rely on the layout font (Outfit will be added to admin layout). Do not set font-family inline.
- Controls (search, filter, checkboxes, sort, pagination) are cosmetic — no state logic required. Static page (server component OK, no "use client" needed).
