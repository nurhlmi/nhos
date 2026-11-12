import "server-only";

import { addDays, format, parseISO } from "date-fns";
import { cached, getStale, type CachedResult } from "@/lib/memory-cache";
import { fetchWithRetry } from "@/lib/http";
import type { SourceMeta } from "@/types/api";
import { zoneForProvince } from "@/features/prayer/constants";
import { zonedNow } from "@/features/prayer/time";
import type { PrayerCity, PrayerDay, PrayerLocation, PrayerMonth, PrayerTimes, PrayerToday } from "@/features/prayer/types";

/**
 * myQuran API v3 (api.myquran.com/v3/doc), which republishes the Kemenag RI
 * prayer schedule per regency/city. No key; rate limited to 120 requests per window.
 * Published times are already local to the city, so the `tz` parameter is not sent.
 */
const BASE_URL = "https://api.myquran.com/v3/sholat";
const SOURCE = "myQuran (Kemenag RI)";
const SOURCE_URL = "https://api.myquran.com/v3/doc";
const NOTE = "Kemenag RI schedule as published by myQuran. Times are local to the selected city.";
const CITIES_TTL = 7 * 24 * 60 * 60 * 1000;
const DAY_TTL = 12 * 60 * 60 * 1000;
const MONTH_TTL = 24 * 60 * 60 * 1000;

class UpstreamError extends Error {
  constructor(message: string, public readonly status = 502) {
    super(message);
  }
}

type Envelope<T> = { status: boolean; message?: string; data?: T };
type RawSchedule = { id: string; kabko: string; prov: string; jadwal: Record<string, { tanggal: string } & PrayerTimes> };

async function get<T>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetchWithRetry(`${BASE_URL}${path}`, { cache: "no-store" }, { retries: 2, timeoutMs: 15_000 });
  } catch {
    throw new UpstreamError("Could not reach api.myquran.com. Try again in a moment.");
  }
  if (res.status === 404) throw new UpstreamError("myQuran has no schedule for this city", 404);
  if (!res.ok) throw new UpstreamError(`myQuran returned ${res.status}`);
  const body = (await res.json()) as Envelope<T>;
  if (!body.status || body.data === undefined) throw new UpstreamError(body.message ?? "myQuran returned no data");
  return body.data;
}

async function withStale<T>(key: string, ttl: number, loader: () => Promise<T>): Promise<CachedResult<T> & { stale: boolean }> {
  try {
    return { ...(await cached(key, ttl, loader)), stale: false };
  } catch (error) {
    const stale = getStale<T>(key);
    if (!stale) throw error;
    return { ...stale, stale: true };
  }
}

function meta(res: { fetchedAt: string; cached: boolean; stale: boolean }): SourceMeta {
  return {
    source: SOURCE,
    sourceUrl: SOURCE_URL,
    fetchedAt: res.fetchedAt,
    freshness: res.stale ? "stale" : res.cached ? "cached" : "live",
    note: NOTE,
  };
}

function toLocation(raw: RawSchedule): PrayerLocation {
  return { id: raw.id, city: raw.kabko, province: raw.prov, ...zoneForProvince(raw.prov) };
}

function toDays(raw: RawSchedule): PrayerDay[] {
  return Object.entries(raw.jadwal)
    .map(([date, { imsak, subuh, terbit, dhuha, dzuhur, ashar, maghrib, isya }]) => ({
      date,
      imsak,
      subuh,
      terbit,
      dhuha,
      dzuhur,
      ashar,
      maghrib,
      isya,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

const loadPeriod = (city: string, period: string, ttl: number) =>
  withStale(`prayer:${city}:${period}`, ttl, () => get<RawSchedule>(`/jadwal/${city}/${period}`));

export async function getPrayerCities(): Promise<{ data: PrayerCity[]; meta: SourceMeta }> {
  const res = await withStale("prayer:cities", CITIES_TTL, async () =>
    (await get<{ id: string; lokasi: string }[]>("/kabkota/semua")).map((c) => ({ id: c.id, name: c.lokasi })),
  );
  return { data: res.value, meta: meta(res) };
}

export async function getPrayerToday(city: string): Promise<{ data: PrayerToday; meta: SourceMeta }> {
  // The city's own date decides "today": 23:30 WIB is already tomorrow in WIT.
  // Its zone comes from the province, which only the schedule carries, so the
  // first call may use the WIB date; the zone is then cached with the schedule.
  const probe = await loadPeriod(city, zonedNow(new Date(), "Asia/Jakarta").date, DAY_TTL);
  const location = toLocation(probe.value);
  const todayDate = zonedNow(new Date(), location.timeZone).date;
  const tomorrowDate = format(addDays(parseISO(todayDate), 1), "yyyy-MM-dd");

  const [today, tomorrow] = await Promise.all([
    todayDate === Object.keys(probe.value.jadwal)[0] ? probe : loadPeriod(city, todayDate, DAY_TTL),
    loadPeriod(city, tomorrowDate, DAY_TTL).catch(() => null),
  ]);
  const todayDay = toDays(today.value)[0];
  if (!todayDay) throw new UpstreamError("myQuran returned no schedule for today");

  return {
    data: { location, today: todayDay, tomorrow: tomorrow ? (toDays(tomorrow.value)[0] ?? null) : null },
    meta: meta(today),
  };
}

export async function getPrayerMonth(city: string, month: string): Promise<{ data: PrayerMonth; meta: SourceMeta }> {
  const res = await loadPeriod(city, month, MONTH_TTL);
  return { data: { location: toLocation(res.value), month, days: toDays(res.value) }, meta: meta(res) };
}
