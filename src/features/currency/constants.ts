import type { CurrencyPair } from "@/features/currency/types";

/** Pairs shown on the Rate monitoring board. */
export const MONITORED_PAIRS: CurrencyPair[] = [
  { base: "USD", quote: "IDR" },
  { base: "EUR", quote: "IDR" },
  { base: "SGD", quote: "IDR" },
  { base: "JPY", quote: "IDR" },
  { base: "GBP", quote: "IDR" },
  { base: "AUD", quote: "IDR" },
  { base: "CNY", quote: "IDR" },
  { base: "MYR", quote: "IDR" },
];

/** Pairs shown on the overview widget. */
export const OVERVIEW_PAIRS: CurrencyPair[] = MONITORED_PAIRS.slice(0, 3);
