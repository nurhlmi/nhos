import "server-only";

import { cached, getStale, type CachedResult } from "@/lib/memory-cache";
import { fetchWithRetry } from "@/lib/http";
import type { SourceMeta } from "@/types/api";
import type { Holiday, HolidayYear } from "@/features/holidays/types";

/**
 * Tanggal Merah API (upset.dev/tanggalmerah): Indonesian national holidays and
 * cuti bersama per the joint ministerial decree (SKB 3 Menteri). No key, no
 * documented rate limit. Dates change only when the government revises the
 * decree, so a day of caching is plenty.
 */
const BASE_URL = "https://tanggalmerah.upset.dev/api";
const SOURCE = "Tanggal Merah";
const SOURCE_URL = "https://upset.dev/tanggalmerah";
const NOTE = "National holidays and cuti bersama from the SKB 3 Menteri, as published by Tanggal Merah.";
const TTL = 24 * 60 * 60 * 1000;

class UpstreamError extends Error {
  constructor(message: string, public readonly status = 502) {
    super(message);
  }
}

type Envelope<T> = { success: boolean; data?: T; error?: string };

async function get<T>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetchWithRetry(`${BASE_URL}${path}`, { cache: "no-store" }, { retries: 2, timeoutMs: 15_000 });
  } catch {
    throw new UpstreamError("Could not reach tanggalmerah.upset.dev. Try again in a moment.");
  }
  let body: Envelope<T> | null = null;
  try {
    body = (await res.json()) as Envelope<T>;
  } catch {
    // non-JSON body
  }
  if (res.status === 404) throw new UpstreamError(body?.error ?? "Tanggal Merah has no data for this year", 404);
  if (!res.ok || !body?.success || body.data === undefined) {
    throw new UpstreamError(body?.error ?? `Tanggal Merah returned ${res.status}`);
  }
  return body.data;
}

async function withStale<T>(key: string, loader: () => Promise<T>): Promise<CachedResult<T> & { stale: boolean }> {
  try {
    return { ...(await cached(key, TTL, loader)), stale: false };
  } catch (error) {
    const stale = getStale<T>(key);
    if (!stale) throw error;
    return { ...stale, stale: true };
  }
}

export async function getHolidays(year: number): Promise<{ data: HolidayYear; meta: SourceMeta }> {
  const [list, years] = await Promise.all([
    withStale(`holidays:${year}`, async () =>
      (await get<(Holiday & { day: string })[]>(`/holidays?year=${year}`))
        .map(({ date, name, type }) => ({ date, name, type }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    ),
    withStale("holidays:years", async () => (await get<number[]>("/years")).sort((a, b) => a - b)).catch(() => null),
  ]);

  return {
    data: { year, holidays: list.value, years: years?.value ?? [year] },
    meta: {
      source: SOURCE,
      sourceUrl: SOURCE_URL,
      fetchedAt: list.fetchedAt,
      freshness: list.stale ? "stale" : list.cached ? "cached" : "live",
      note: NOTE,
    },
  };
}
