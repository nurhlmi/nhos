export const HISTORY_RANGES = ["1D", "7D", "1M", "3M", "6M", "1Y"] as const;
export type HistoryRange = (typeof HISTORY_RANGES)[number];

export type CurrencyPair = { base: string; quote: string };

export type PairQuote = {
  base: string;
  quote: string;
  rate: number;
  /** Date of the latest fixing (YYYY-MM-DD). */
  date: string;
  previousRate: number | null;
  previousDate: string | null;
  change: number | null;
  changePercent: number | null;
};

export type HistoryPoint = { date: string; rate: number };

export type PairHistory = {
  base: string;
  quote: string;
  range: HistoryRange;
  points: HistoryPoint[];
  /** Comparison of the last point against the first point of the range. */
  periodChange: number | null;
  periodChangePercent: number | null;
  high: number | null;
  low: number | null;
};

export type CurrencyList = Record<string, string>;

export type Conversion = {
  from: string;
  to: string;
  amount: number;
  result: number;
  rate: number;
  date: string;
};
