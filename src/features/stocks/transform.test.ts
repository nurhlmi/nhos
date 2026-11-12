import { test } from "node:test";
import assert from "node:assert/strict";
import { companyName, summarize, toCandles, toQuote, type YahooChart } from "./transform.ts";

// Trimmed from a real BBCA.JK response (range=5d). Timestamps are 09:00 WIB session opens.
const bbca: YahooChart = {
  meta: { regularMarketPrice: 5425, gmtoffset: 25200, longName: "PT Bank Central Asia Tbk", shortName: "Bank Central Asia Tbk" },
  timestamp: [1793930400, 1794189600, 1794276000, 1794362400, 1794448800],
  indicators: {
    quote: [
      {
        open: [5025, 5300, 5325, 5350, 5325],
        high: [5200, 5350, 5400, 5350, 5425],
        low: [4990, 5250, 5275, 5250, 5275],
        close: [5200, 5325, 5300, 5325, 5425],
        volume: [160152800, 281069100, 112221300, 92364800, 154887300],
      },
    ],
  },
};

test("candles use the WIB trading date, oldest first", () => {
  const candles = toCandles(bbca);
  assert.deepEqual(candles.map((c) => c.date), ["2026-11-06", "2026-11-09", "2026-11-10", "2026-11-11", "2026-11-12"]);
});

test("holidays with null prices are dropped", () => {
  const chart: YahooChart = { ...bbca, indicators: { quote: [{ ...bbca.indicators.quote[0], close: [5200, null, 5300, 5325, 5425] }] } };
  assert.equal(toCandles(chart).length, 4);
});

test("quote compares the live price with the previous session", () => {
  const q = toQuote("BBCA", bbca, "Bank Central Asia");
  assert.equal(q.date, "2026-11-12");
  assert.equal(q.last, 5425);
  assert.equal(q.prev, 5325);
  assert.equal(q.change, 100);
  assert.equal(q.changePercent?.toFixed(3), "1.878");
  assert.equal(q.high, 5425);
  assert.equal(q.volume, 154887300);
});

test("company names lose the PT prefix and Tbk suffix", () => {
  assert.equal(companyName(bbca.meta), "Bank Central Asia");
  assert.equal(
    companyName({ longName: "Perusahaan Perseroan (Persero) PT Telekomunikasi Indonesia Tbk", shortName: "Telkom Indonesia (Persero) Tbk." }),
    "Telkom Indonesia (Persero)",
  );
  assert.equal(companyName({}), null);
});

test("summary covers the range and keeps the day change", () => {
  const h = summarize("BBCA", "1M", toCandles(bbca), "2026-11-10");
  assert.equal(h.points.length, 3);
  assert.equal(h.latest, 5425);
  assert.equal(h.dayChangePercent?.toFixed(3), "1.878");
  assert.equal(h.periodChangePercent?.toFixed(3), "2.358");
  assert.equal(h.high, 5425);
  assert.equal(h.low, 5250);
});
