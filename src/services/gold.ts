import "server-only";

import { parseISO, format, subDays, subMonths, subYears } from "date-fns";
import { cached, getStale, type CachedResult } from "@/lib/memory-cache";
import { fetchWithRetry } from "@/lib/http";
import type { SourceMeta } from "@/types/api";
import type { GoldBoard, GoldHistory, GoldPoint, GoldRange } from "@/features/gold/types";
import { buildBoard, buildSeries, vendorCodes, type Galeri24Row } from "@/features/gold/transform";

/**
 * Galeri 24's own price API (the backend of galeri24.co.id/harga-emas). No key.
 * Rows are newest first; `take` sets the page size and `vendorCode` filters by product line.
 */
const BASE_URL = "https://galeri24.co.id/api/gold-prices";
const SOURCE = "Galeri 24";
const SOURCE_URL = "https://galeri24.co.id/harga-emas";
const NOTE = "Galeri 24 price list, updated one or more times a day. Selling is what Galeri 24 charges; buyback is what it pays.";
const BOARD_TTL = 30 * 60 * 1000;
const HISTORY_TTL = 3 * 60 * 60 * 1000;
/** About 3 days of rows across all product lines (roughly 300 rows per day). */
const BOARD_ROWS = 1000;
/** About a year for the largest product line (roughly 25 rows per day). */
const HISTORY_ROWS = 10_000;

class UpstreamError extends Error {
  constructor(message: string, public readonly status = 502) {
    super(message);
  }
}

async function getRows(params: Record<string, string>): Promise<Galeri24Row[]> {
  let res: Response;
  try {
    res = await fetchWithRetry(`${BASE_URL}?${new URLSearchParams(params)}`, { cache: "no-store" }, { retries: 2, timeoutMs: 20_000 });
  } catch {
    throw new UpstreamError("Could not reach galeri24.co.id. Try again in a moment.");
  }
  if (!res.ok) throw new UpstreamError(`Galeri 24 returned ${res.status}`);
  const body = (await res.json()) as { results?: Galeri24Row[] };
  if (!Array.isArray(body.results)) throw new UpstreamError("Galeri 24 returned no price data");
  return body.results;
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

function meta(res: { fetchedAt: string; cached: boolean; stale: boolean }, sourceUpdatedAt: string | null): SourceMeta {
  return {
    source: SOURCE,
    sourceUrl: SOURCE_URL,
    fetchedAt: res.fetchedAt,
    sourceUpdatedAt,
    freshness: res.stale ? "stale" : res.cached ? "cached" : "live",
    note: NOTE,
  };
}

const loadLatest = () =>
  withStale("gold:latest", BOARD_TTL, async () => {
    const rows = await getRows({ take: String(BOARD_ROWS) });
    return { board: buildBoard(rows), codes: vendorCodes(rows) };
  });

export async function getGoldBoard(): Promise<{ data: GoldBoard; meta: SourceMeta }> {
  const res = await loadLatest();
  return { data: res.value.board, meta: meta(res, res.value.board.date) };
}

function rangeStart(range: GoldRange, latest: string): string {
  const end = parseISO(latest);
  const start =
    range === "7D" ? subDays(end, 7)
    : range === "1M" ? subMonths(end, 1)
    : range === "3M" ? subMonths(end, 3)
    : range === "6M" ? subMonths(end, 6)
    : subYears(end, 1);
  return format(start, "yyyy-MM-dd");
}

export async function getGoldHistory(type: string, weight: number, range: GoldRange): Promise<{ data: GoldHistory; meta: SourceMeta }> {
  const code = (await loadLatest()).value.codes[type];
  if (!code) throw new UpstreamError(`Galeri 24 does not list "${type}"`, 404);

  // One request per product line serves every weight in it.
  const res = await withStale(`gold:series:${code}`, HISTORY_TTL, async () =>
    buildSeries(await getRows({ vendorCode: code, take: String(HISTORY_ROWS) })),
  );
  const all = res.value.get(weight) ?? [];
  const lastDate = all.at(-1)?.date;
  const start = lastDate ? rangeStart(range, lastDate) : null;
  const points = start ? all.filter((p) => p.date >= start) : all;

  const basis: GoldHistory["basis"] = all.some((p) => p.sell !== null) ? "sell" : "buyback";
  const valued = points.filter((p) => p[basis] !== null) as (GoldPoint & Record<typeof basis, number>)[];
  const values = valued.map((p) => p[basis]);

  // Day change compares the latest day against the day before it, both from the full series.
  const latestPoint = all.at(-1) ?? null;
  const latest = latestPoint?.[basis] ?? null;
  const previousPoint = all.length > 1 ? all.at(-2)! : null;
  const previous = previousPoint?.[basis] ?? null;
  const first = valued[0]?.[basis];
  const last = valued.at(-1)?.[basis];

  return {
    data: {
      type,
      weight,
      range,
      points,
      basis,
      latest,
      latestDate: latestPoint?.date ?? null,
      previous,
      previousDate: previousPoint?.date ?? null,
      dayChangePercent: latest !== null && previous ? ((latest - previous) / previous) * 100 : null,
      periodChangePercent: first && last !== undefined && valued.length > 1 ? ((last - first) / first) * 100 : null,
      high: values.length ? Math.max(...values) : null,
      low: values.length ? Math.min(...values) : null,
    },
    meta: meta(res, latestPoint?.date ?? null),
  };
}
