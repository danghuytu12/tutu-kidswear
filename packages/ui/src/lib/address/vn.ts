// Vietnamese administrative divisions, bundled rather than fetched.
//
// Shipped as data so checkout never depends on a third-party API being up —
// an outage there would otherwise block every order.
//
// Reflects the July 2025 reorganisation: 34 provinces, and no district level
// (the old province → district → ward chain is now province → ward). Source:
// provinces.open-api.vn v2. Regenerate the JSON when the divisions change.

import divisions from "./vn-divisions.json";

export interface Ward {
  /** Official division code. */
  code: number;
  name: string;
}

export interface Province {
  code: number;
  name: string;
  wards: Ward[];
}

/** Provinces sorted by Vietnamese collation, each with its wards sorted too. */
export const PROVINCES: Province[] = (
  divisions as { c: number; n: string; w: { c: number; n: string }[] }[]
).map((p) => ({
  code: p.c,
  name: p.n,
  wards: p.w.map((w) => ({ code: w.c, name: w.n })),
}));

/** Wards of one province, by name. Empty when the name is unknown. */
export function wardsOfProvince(provinceName: string): Ward[] {
  return PROVINCES.find((p) => p.name === provinceName)?.wards ?? [];
}
