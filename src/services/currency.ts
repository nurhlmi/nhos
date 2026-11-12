import "server-only";

import { format, subDays, subMonths, subYears } from "date-fns";
import { cached } from "@/lib/memory-cache";
import { fetchWithRetry } from "@/lib/http";
import type { SourceMeta } from "@/types/api";
import type {
  Conversion,
  CurrencyList,
  CurrencyPair,
  HistoryRange,
  PairHistory,
  PairQuote,
} from "@/features/currency/types";

/**
 * Frankfurter – open-source API for European Central Bank reference rates.
 * Docs: https://frankfurter.dev  ·  No API key required.
 * ECB publishes one reference rate per business day (~16:00 CET), so these
 * are daily reference rates, not tick-by-tick market quotes.
 */
const BASE_URL = "https://api.frankfurter.dev/v1";
const SOURCE = "European Central Bank via Frankfurter";
const SOURCE_URL = "https://frankfurter.dev";
const LATEST_TTL = 30 * 60 * 1000;
const HISTORY_TTL = 6 * 60 * 60 * 1000;

export class UpstreamError extends Error {
  constructor(message: string, public readonly status = 502) {
    super(message);
  }
}

type FrankfurterLatest = { amount: number; base: string; date: string; rates: Record<string, number> };
type FrankfurterSeries = {
  amount: number;
  base: string;
  start_date: string;
  end_date: string;
  rates: Record<string, Record<string, number>>;
};

async function getJson<T>(path: string): Promise<T> {
  const res = await fetchWithRetry(`${BASE_URL}${path}`, { cache: "no-store" });
  if (res.status === 404 || res.status === 422) {
    throw new UpstreamError("Currency not supported by the data source", 400);
  }
  if (!res.ok) throw new UpstreamError(`Exchange rate source returned ${res.status}`);
  return (await res.json()) as T;
}

function meta(fetchedAt: string, isCached: boolean, sourceUpdatedAt: string | null, note?: string): SourceMeta {
  return {
    source: SOURCE,
    sourceUrl: SOURCE_URL,
    fetchedAt,
    sourceUpdatedAt,
    freshness: isCached ? "cached" : "live",
    note: note ?? "ECB daily reference rates, published once per business day around 16:00 CET.",
  };
}

export async function getCurrencies(): Promise<{ data: CurrencyList; meta: SourceMeta }> {
  const res = await cached("fx:currencies", 24 * 60 * 60 * 1000, () => getJson<CurrencyList>("/currencies"));
  return { data: res.value, meta: meta(res.fetchedAt, res.cached, null) };
}

/** Last ~2 weeks of fixings for one base currency; used to derive latest + previous. */
async function getRecentSeries(base: string, symbols: string[]) {
  const start = format(subDays(new Date(), 14), "yyyy-MM-dd");
  const key = `fx:recent:${base}:${[...symbols].sort().join(",")}:${start}`;
  return cached(key, LATEST_TTL, () =>
    getJson<FrankfurterSeries>(`/${start}..?base=${base}&symbols=${symbols.join(",")}`),
  );
}

export async function getPairQuotes(pairs: CurrencyPair[]): Promise<{ data: PairQuote[]; meta: SourceMeta }> {
  const byBase = new Map<string, Set<string>>();
  for (const { base, quote } of pairs) {
    if (!byBase.has(base)) byBase.set(base, new Set());
    byBase.get(base)!.add(quote);
  }

  const results = await Promise.all(
    [...byBase.entries()].map(async ([base, quotes]) => ({ base, res: await getRecentSeries(base, [...quotes]) })),
  );

  let fetchedAt = new Date(0).toISOString();
  let anyLive = false;
  let latestDate: string | null = null;
  const quotes: PairQuote[] = [];

  for (const { base, res } of results) {
    if (res.fetchedAt > fetchedAt) fetchedAt = res.fetchedAt;
    if (!res.cached) anyLive = true;
    const dates = Object.keys(res.value.rates).sort();
    const last = dates.at(-1);
    const prev = dates.at(-2);
    if (!last) continue;
    if (!latestDate || last > latestDate) latestDate = last;

    for (const quote of byBase.get(base) ?? []) {
      const rate = res.value.rates[last]?.[quote];
      if (rate === undefined) continue;
      const previousRate = prev ? (res.value.rates[prev]?.[quote] ?? null) : null;
      const change = previousRate !== null ? rate - previousRate : null;
      quotes.push({
        base,
        quote,
        rate,
        date: last,
        previousRate,
        previousDate: prev ?? null,
        change,
        changePercent: change !== null && previousRate ? (change / previousRate) * 100 : null,
      });
    }
  }

  // Preserve requested order
  const ordered = pairs
    .map((p) => quotes.find((q) => q.base === p.base && q.quote === p.quote))
    .filter((q): q is PairQuote => Boolean(q));

  return { data: ordered, meta: meta(fetchedAt, !anyLive, latestDate) };
}

function rangeStart(range: HistoryRange): Date {
  const now = new Date();
  switch (range) {
    case "1D":
      // Daily source: fetch a few days back and keep the last two fixings.
      return subDays(now, 7);
    case "7D":
      return subDays(now, 7);
    case "1M":
      return subMonths(now, 1);
    case "3M":
      return subMonths(now, 3);
    case "6M":
      return subMonths(now, 6);
    case "1Y":
      return subYears(now, 1);
  }
}

export async function getPairHistory(
  base: string,
  quote: string,
  range: HistoryRange,
): Promise<{ data: PairHistory; meta: SourceMeta }> {
  const start = format(rangeStart(range), "yyyy-MM-dd");
  const res = await cached(`fx:hist:${base}:${quote}:${start}`, range === "1D" || range === "7D" ? LATEST_TTL : HISTORY_TTL, () =>
    getJson<FrankfurterSeries>(`/${start}..?base=${base}&symbols=${quote}`),
  );

  let points = Object.entries(res.value.rates)
    .map(([date, rates]) => ({ date, rate: rates[quote] }))
    .filter((p): p is { date: string; rate: number } => typeof p.rate === "number")
    .sort((a, b) => a.date.localeCompare(b.date));

  if (range === "1D") points = points.slice(-2);

  const first = points[0];
  const last = points.at(-1);
  const periodChange = first && last ? last.rate - first.rate : null;
  const rates = points.map((p) => p.rate);

  return {
    data: {
      base,
      quote,
      range,
      points,
      periodChange,
      periodChangePercent: periodChange !== null && first ? (periodChange / first.rate) * 100 : null,
      high: rates.length ? Math.max(...rates) : null,
      low: rates.length ? Math.min(...rates) : null,
    },
    meta: meta(
      res.fetchedAt,
      res.cached,
      last?.date ?? null,
      range === "1D"
        ? "Historical daily fixings. 1D compares the two most recent ECB fixings (no intraday data)."
        : "Historical ECB daily reference rates (business days only).",
    ),
  };
}

export async function convert(from: string, to: string, amount: number): Promise<{ data: Conversion; meta: SourceMeta }> {
  if (from === to) {
    const today = format(new Date(), "yyyy-MM-dd");
    return {
      data: { from, to, amount, result: amount, rate: 1, date: today },
      meta: meta(new Date().toISOString(), false, null, "Same currency, no conversion needed."),
    };
  }
  const res = await cached(`fx:latest:${from}:${to}`, LATEST_TTL, () =>
    getJson<FrankfurterLatest>(`/latest?base=${from}&symbols=${to}`),
  );
  const rate = res.value.rates[to];
  if (rate === undefined) throw new UpstreamError("Rate not available for this pair", 404);
  return {
    data: { from, to, amount, rate, result: amount * rate, date: res.value.date },
    meta: meta(res.fetchedAt, res.cached, res.value.date),
  };
}
