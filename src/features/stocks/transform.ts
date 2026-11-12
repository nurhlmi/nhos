import type { Candle, StockHistory, StockQuote, StockRange } from "./types.ts";

/** The parts of a Yahoo Finance v8 chart response that nhOS reads. */
export type YahooChart = {
  meta: {
    regularMarketPrice?: number | null;
    regularMarketTime?: number | null;
    gmtoffset?: number | null;
    longName?: string | null;
    shortName?: string | null;
  };
  timestamp?: number[] | null;
  indicators: {
    quote: {
      open?: (number | null)[];
      high?: (number | null)[];
      low?: (number | null)[];
      close?: (number | null)[];
      volume?: (number | null)[];
    }[];
  };
};

const num = (value: number | null | undefined) => (typeof value === "number" && Number.isFinite(value) ? value : null);

/** Trading date (YYYY-MM-DD) in the exchange's own time zone. */
const tradingDay = (unixSeconds: number, gmtOffset: number) => new Date((unixSeconds + gmtOffset) * 1000).toISOString().slice(0, 10);

/** Daily candles, oldest first. Holidays come back with null prices and are dropped. */
export function toCandles(chart: YahooChart): Candle[] {
  const q = chart.indicators.quote[0] ?? {};
  const offset = chart.meta.gmtoffset ?? 0;
  const byDay = new Map<string, Candle>();
  (chart.timestamp ?? []).forEach((t, i) => {
    const close = num(q.close?.[i]);
    if (close === null) return;
    // A later row for the same day (today's live candle) replaces an earlier one.
    byDay.set(tradingDay(t, offset), {
      date: tradingDay(t, offset),
      open: num(q.open?.[i]),
      high: num(q.high?.[i]),
      low: num(q.low?.[i]),
      close,
      volume: num(q.volume?.[i]),
    });
  });
  return [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * "PT Bank Central Asia Tbk" becomes "Bank Central Asia". The long name is
 * preferred because Yahoo truncates short names, except when it is a legal
 * form like "Perusahaan Perseroan (Persero) PT Telekomunikasi Indonesia Tbk".
 */
export function companyName(meta: YahooChart["meta"]): string | null {
  const raw = meta.longName && /^PT\.?\s/i.test(meta.longName) ? meta.longName : (meta.shortName ?? meta.longName);
  if (!raw) return null;
  return raw.replace(/^PT\.?\s+/i, "").replace(/,?\s+Tbk\.?$/i, "").trim() || null;
}

/** Latest quote from a few days of daily candles. The day change compares with the previous session's close. */
export function toQuote(code: string, chart: YahooChart, name: string | null): StockQuote {
  const candles = toCandles(chart);
  const today = candles.at(-1) ?? null;
  const prev = candles.at(-2)?.close ?? null;
  const last = num(chart.meta.regularMarketPrice) ?? today?.close ?? null;
  return {
    code,
    name,
    date: today?.date ?? null,
    last,
    prev,
    change: last !== null && prev !== null ? last - prev : null,
    changePercent: last !== null && prev ? ((last - prev) / prev) * 100 : null,
    open: today?.open ?? null,
    high: today?.high ?? null,
    low: today?.low ?? null,
    volume: today?.volume ?? null,
  };
}

/**
 * Summary figures for a range. `all` is the longest series loaded, so the day
 * change still works when the range holds a single candle.
 */
export function summarize(code: string, range: StockRange, all: Candle[], start: string): StockHistory {
  const points = all.filter((p) => p.date >= start);
  const closes = points.map((p) => p.close).filter((v): v is number => v !== null);
  const valued = all.filter((p) => p.close !== null);
  const latestPoint = valued.at(-1) ?? null;
  const latest = latestPoint?.close ?? null;
  const previous = valued.at(-2)?.close ?? null;
  const first = closes[0];
  const last = closes.at(-1);
  const highs = points.map((p) => p.high ?? p.close).filter((v): v is number => v !== null);
  const lows = points.map((p) => p.low ?? p.close).filter((v): v is number => v !== null);
  return {
    code,
    range,
    points,
    latest,
    latestDate: latestPoint?.date ?? null,
    previous,
    dayChangePercent: latest !== null && previous ? ((latest - previous) / previous) * 100 : null,
    periodChangePercent: first && last !== undefined && closes.length > 1 ? ((last - first) / first) * 100 : null,
    high: highs.length ? Math.max(...highs) : null,
    low: lows.length ? Math.min(...lows) : null,
  };
}
