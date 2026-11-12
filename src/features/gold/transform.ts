import type { GoldPoint, GoldProduct } from "./types.ts";

/** One row of https://galeri24.co.id/api/gold-prices. Numbers arrive as strings. */
export type Galeri24Row = {
  vendorName: string;
  vendorCode: string;
  denomination: string;
  sellingPrice: string;
  buybackPrice: string;
  date: string;
  createdAt: string;
};

/** Galeri 24 reports 0 for items that are out of stock. */
export const toPrice = (value: string) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
};

/**
 * Galeri 24 can publish several price lists a day. Keeps the newest row per
 * product line, weight and date.
 */
function newestPerDay(rows: Galeri24Row[]): Galeri24Row[] {
  const newest = new Map<string, Galeri24Row>();
  for (const row of rows) {
    const key = `${row.vendorName}|${row.denomination}|${row.date}`;
    const seen = newest.get(key);
    if (!seen || row.createdAt > seen.createdAt) newest.set(key, row);
  }
  return [...newest.values()];
}

/** Today's board: the newest row per product line and weight on the latest date. */
export function buildBoard(rows: Galeri24Row[]): { date: string | null; products: GoldProduct[] } {
  const date = rows.reduce<string | null>((max, r) => (!max || r.date > max ? r.date : max), null);
  const products = new Map<string, GoldProduct>();
  for (const row of newestPerDay(rows.filter((r) => r.date === date))) {
    if (!products.has(row.vendorName)) products.set(row.vendorName, { type: row.vendorName, items: [] });
    products.get(row.vendorName)!.items.push({
      weight: Number(row.denomination),
      sell: toPrice(row.sellingPrice),
      buyback: toPrice(row.buybackPrice),
    });
  }
  const list = [...products.values()];
  for (const p of list) p.items.sort((a, b) => a.weight - b.weight);
  list.sort((a, b) => a.type.localeCompare(b.type));
  return { date, products: list };
}

/** Daily series per weight for one product line, oldest first. */
export function buildSeries(rows: Galeri24Row[]): Map<number, GoldPoint[]> {
  const series = new Map<number, GoldPoint[]>();
  for (const row of newestPerDay(rows)) {
    const weight = Number(row.denomination);
    if (!series.has(weight)) series.set(weight, []);
    series.get(weight)!.push({ date: row.date, sell: toPrice(row.sellingPrice), buyback: toPrice(row.buybackPrice) });
  }
  for (const points of series.values()) points.sort((a, b) => a.date.localeCompare(b.date));
  return series;
}

/** Vendor codes needed to request one product line's history. */
export function vendorCodes(rows: Galeri24Row[]): Record<string, string> {
  return Object.fromEntries(rows.map((r) => [r.vendorName, r.vendorCode]));
}
