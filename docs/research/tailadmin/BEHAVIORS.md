# TailAdmin Clone — Behaviors & Tokens

Scope: content of `/products-list` and `/add-product`, embedded into the existing
COCANDY admin shell (sidebar + topbar kept as-is). Only the `<main>` content is cloned.

## Design Tokens (from getComputedStyle)

- **Font family:** `Outfit` (already close — admin currently uses Be Vietnam Pro; we add Outfit for these pages via a wrapper class OR switch layout font). Decision: keep admin font but the TailAdmin look uses Outfit — we'll add Outfit to admin layout since it's a dashboard-wide font.
- **Page background:** `#F9FAFB`
- **Card:** background `#FFFFFF`, border `1px solid #E4E7EC`, radius `12px` (list card `rounded-xl`) / `16px` (form cards `rounded-2xl`)
- **Brand primary:** `#465FFF` (brand-500); hover `#3641F5` (brand-600); disabled `#9CB9FF` (brand-300)
- **Text colors:** gray-800 `#1D2939`, gray-700 `#344054`, gray-500 `#667085`, gray-400 `#98A2B3`
- **Border (inputs):** gray-300 `#D0D5DD`; card border gray-200 `#E4E7EC`
- **In Stock badge:** text `#027A48` (green-700), bg `#ECFDF3` (green-50)
- **Out of Stock badge:** text `#B42318` (red-700), bg `#FEF3F2` (red-50)
- **Radius:** inputs/buttons `8px` (rounded-lg), badges `9999px` (rounded-full)
- **Input height:** `44px` (h-11); padding `10px 16px`; font `14px`

## Interaction Models

- **products-list table:** static render. Sortable-looking column headers (up/down chevrons) — cosmetic only for clone. Row `hover:bg-gray-50`. Checkbox column (custom 16px box, cosmetic). Pagination footer with prev/next arrows + numbered buttons (active = brand-500 filled). Search input + Filter button (cosmetic, no filtering needed for clone).
- **add-product form:** static form. Selects show placeholder gray-400 text. Stock quantity is a stepper (− / input / +). Image dropzone: dashed border, `hover:border-brand-500`. Footer buttons Draft (outline) + Publish Product (brand).

## Hover states

- Table row: `hover:bg-gray-50` (#F9FAFB)
- Brand buttons: bg `#465FFF` → `#3641F5`
- Outline buttons (Export/Draft): `hover:bg-gray-50`
- Dropzone: `border-gray-300` → `border-brand-500` on hover

## Responsive

- **Desktop (≥768px):** form grids are 2-col (Product Name/Category etc.), 3-col for Weight/Length/Width. Table full width.
- **Mobile (<768px):** grids collapse to 1 col (`grid-cols-1`). Card header buttons stack (`flex-col`). Table scrolls horizontally (`overflow-x-auto`). Pagination footer stacks (`flex-col`).
- **Breakpoint:** `md` = 768px, `sm` = 640px.
