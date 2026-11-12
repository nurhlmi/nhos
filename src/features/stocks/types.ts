export const STOCK_RANGES = ["1M", "3M", "6M", "1Y", "2Y"] as const;
export type StockRange = (typeof STOCK_RANGES)[number];

/** Latest daily figures for a stock or index. Prices in Rupiah, volume in shares. `null` means the source sent no value. */
export type StockQuote = {
  code: string;
  name: string | null;
  /** Trading date of the latest session (YYYY-MM-DD, WIB). */
  date: string | null;
  last: number | null;
  prev: number | null;
  change: number | null;
  changePercent: number | null;
  open: number | null;
  high: number | null;
  low: number | null;
  volume: number | null;
};

export type Candle = {
  /** Trading date (YYYY-MM-DD, WIB). */
  date: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: number | null;
};

export type StockHistory = {
  code: string;
  range: StockRange;
  points: Candle[];
  latest: number | null;
  latestDate: string | null;
  previous: number | null;
  dayChangePercent: number | null;
  periodChangePercent: number | null;
  high: number | null;
  low: number | null;
};
