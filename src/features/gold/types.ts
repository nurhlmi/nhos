export const GOLD_RANGES = ["7D", "1M", "3M", "6M", "1Y"] as const;
export type GoldRange = (typeof GOLD_RANGES)[number];

/** Prices in IDR. `null` means the source lists the item but does not sell (or buy back) it today. */
export type GoldPrice = {
  weight: number;
  sell: number | null;
  buyback: number | null;
};

export type GoldProduct = { type: string; items: GoldPrice[] };

export type GoldBoard = {
  /** Date the source recorded these prices (YYYY-MM-DD). */
  date: string | null;
  products: GoldProduct[];
};

export type GoldPoint = { date: string; sell: number | null; buyback: number | null };

export type GoldHistory = {
  type: string;
  weight: number;
  range: GoldRange;
  points: GoldPoint[];
  /** Series the summary figures are based on: selling price, or buyback when the item is never sold. */
  basis: "sell" | "buyback";
  latest: number | null;
  latestDate: string | null;
  previous: number | null;
  previousDate: string | null;
  dayChangePercent: number | null;
  periodChangePercent: number | null;
  high: number | null;
  low: number | null;
};
