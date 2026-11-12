import "server-only";

import { format, parseISO, subMonths, subYears } from "date-fns";
import { cached, getStale, type CachedResult } from "@/lib/memory-cache";
import { fetchWithRetry } from "@/lib/http";
import type { SourceMeta } from "@/types/api";
import { COMPOSITE } from "@/features/stocks/constants";
import type { StockHistory, StockQuote, StockRange } from "@/features/stocks/types";
import { companyName, summarize, toCandles, toQuote, type YahooChart } from "@/features/stocks/transform";

/**
 * Yahoo Finance chart endpoint. No key, but unofficial: Yahoo can rate limit
 * or change it, so responses are cached and the last good copy is served on failure.
 */
const BASE_URL = "https://query1.finance.yahoo.com/v8/finance/chart";
const SOURCE = "Yahoo Finance";
const NOTE = "IDX prices from Yahoo Finance, usually delayed by about 10 minutes. Prices in Rupiah, volume in shares.";
const QUOTE_TTL = 5 * 60 * 1000;
const HISTORY_TTL = 60 * 60 * 1000;

class UpstreamError extends Error {
  constructor(message: string, public readonly status = 502) {
    super(message);
  }
}

const symbolFor = (code: string) => (code === COMPOSITE ? "^JKSE" : `${code}.JK`);
const pageFor = (code: string) => `https://finance.yahoo.com/quote/${encodeURIComponent(symbolFor(code))}`;

async function chart(code: string, range: "5d" | "2y"): Promise<YahooChart> {
  const url = `${BASE_URL}/${encodeURIComponent(symbolFor(code))}?${new URLSearchParams({ range, interval: "1d" })}`;
  let res: Response;
  try {
    // Yahoo rejects requests without a browser-like User-Agent.
    res = await fetchWithRetry(url, { cache: "no-store", headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" } }, { retries: 2, timeoutMs: 15_000 });
  } catch {
    throw new UpstreamError("Could not reach Yahoo Finance. Try again in a moment.");
  }
  if (res.status === 404) throw new UpstreamError(`Yahoo Finance has no data for ${code}. Check the stock code.`, 404);
  if (res.status === 429) throw new UpstreamError("Yahoo Finance is rate limiting requests. Try again in a few minutes.", 429);
  if (!res.ok) throw new UpstreamError(`Yahoo Finance returned ${res.status}`);
  const body = (await res.json()) as { chart?: { result?: YahooChart[] | null } };
  const result = body.chart?.result?.[0];
  if (!result) throw new UpstreamError(`Yahoo Finance returned no data for ${code}`);
  return result;
}

/** Serves the last good copy when the source fails, instead of an error. */
async function withStale<T>(key: string, ttl: number, loader: () => Promise<T>): Promise<CachedResult<T> & { stale: boolean }> {
  try {
    return { ...(await cached(key, ttl, loader)), stale: false };
  } catch (error) {
    const stale = getStale<T>(key);
    if (!stale) throw error;
    return { ...stale, stale: true };
  }
}

function meta(res: { fetchedAt: string; cached: boolean; stale: boolean }, sourceUrl: string, sourceUpdatedAt: string | null): SourceMeta {
  return {
    source: SOURCE,
    sourceUrl,
    fetchedAt: res.fetchedAt,
    sourceUpdatedAt,
    freshness: res.stale ? "stale" : res.cached ? "cached" : "live",
    note: NOTE,
  };
}

const loadQuote = (code: string) =>
  withStale(`stocks:quote:${code}`, QUOTE_TTL, async () => {
    const c = await chart(code, "5d");
    return toQuote(code, c, code === COMPOSITE ? "IDX Composite" : companyName(c.meta));
  });

export async function getIndexSnapshot(): Promise<{ data: StockQuote; meta: SourceMeta }> {
  const res = await loadQuote(COMPOSITE);
  return { data: res.value, meta: meta(res, pageFor(COMPOSITE), res.value.date) };
}

export async function getStockQuotes(codes: string[]): Promise<{ data: StockQuote[]; meta: SourceMeta }> {
  const results = await Promise.allSettled(codes.map(loadQuote));
  const ok = results.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
  if (ok.length === 0) throw (results.find((r) => r.status === "rejected") as PromiseRejectedResult).reason;

  const oldest = ok.reduce((a, b) => (a.fetchedAt < b.fetchedAt ? a : b));
  const latestDate = ok.map((r) => r.value.date).filter((d): d is string => d !== null).sort().at(-1) ?? null;
  return {
    data: ok.map((r) => r.value),
    meta: meta({ fetchedAt: oldest.fetchedAt, cached: ok.every((r) => r.cached), stale: ok.some((r) => r.stale) }, "https://finance.yahoo.com/markets/stocks/", latestDate),
  };
}

function rangeStart(range: StockRange, latest: string): string {
  const end = parseISO(latest);
  const start =
    range === "1M" ? subMonths(end, 1)
    : range === "3M" ? subMonths(end, 3)
    : range === "6M" ? subMonths(end, 6)
    : range === "1Y" ? subYears(end, 1)
    : subYears(end, 2);
  return format(start, "yyyy-MM-dd");
}

export async function getStockHistory(code: string, range: StockRange): Promise<{ data: StockHistory; meta: SourceMeta }> {
  // One two-year request serves every range for the code.
  const res = await withStale(`stocks:history:${code}`, HISTORY_TTL, async () => toCandles(await chart(code, "2y")));
  const all = res.value;
  const lastDate = all.at(-1)?.date;
  const data = summarize(code, range, all, lastDate ? rangeStart(range, lastDate) : "");
  return { data, meta: meta(res, pageFor(code), data.latestDate) };
}
