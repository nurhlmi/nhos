import "server-only";

import { APP_NAME, getPublicEnv } from "@/lib/env";
import { serverEnv } from "@/lib/server-env";
import { acquireSlot } from "@/lib/rate-limit";
import { FEED_SOURCES } from "@/features/news/feeds";
import type { ApiCheck, ApiMonitorReport, ApiStatus } from "@/features/api-monitor/types";

type Probe = { url: string; headers?: Record<string, string>; timeoutMs?: number; before?: () => Promise<void> };

type ApiDefinition = {
  id: string;
  name: string;
  feature: string;
  /** Base URL shown in the table. */
  url: string;
  key: { required: boolean; configured: boolean } | null;
  /** Returns the request used for the health check, or null when it cannot be sent. */
  probe: () => Probe | null;
};

const FEED_UA = `${APP_NAME.replace(/\s+/g, "-")}/1.0 (personal RSS reader)`;
const DEFAULT_TIMEOUT = 10_000;
const TTL = 60_000;
const MIN_REFRESH_GAP = 10_000;

function tmdbProbe(): Probe | null {
  const base = "https://api.themoviedb.org/3/configuration";
  if (serverEnv.tmdbReadToken) return { url: base, headers: { Authorization: `Bearer ${serverEnv.tmdbReadToken}` } };
  if (serverEnv.tmdbApiKey) return { url: `${base}?${new URLSearchParams({ api_key: serverEnv.tmdbApiKey })}` };
  return null;
}

function supabaseProbe(): Probe | null {
  const { supabaseUrl, supabaseKey } = getPublicEnv();
  if (!supabaseUrl || !supabaseKey) return null;
  return { url: `${supabaseUrl.replace(/\/$/, "")}/auth/v1/health`, headers: { apikey: supabaseKey } };
}

function definitions(): ApiDefinition[] {
  const { supabaseUrl, supabaseKey } = getPublicEnv();
  const nvdKey = serverEnv.nvdApiKey;

  return [
    {
      id: "supabase",
      name: "Supabase",
      feature: "Auth & database",
      url: supabaseUrl || "NEXT_PUBLIC_SUPABASE_URL not set",
      key: { required: true, configured: Boolean(supabaseUrl && supabaseKey) },
      probe: supabaseProbe,
    },
    {
      id: "frankfurter",
      name: "Frankfurter (ECB rates)",
      feature: "Currency Exchange",
      url: "https://api.frankfurter.dev/v1",
      key: null,
      probe: () => ({ url: "https://api.frankfurter.dev/v1/latest?base=USD&symbols=IDR" }),
    },
    {
      id: "galeri24",
      name: "Galeri 24",
      feature: "Gold Prices",
      url: "https://galeri24.co.id/api/gold-prices",
      key: null,
      probe: () => ({ url: "https://galeri24.co.id/api/gold-prices?take=1", timeoutMs: 20_000 }),
    },
    {
      id: "yahoo",
      name: "Yahoo Finance chart",
      feature: "Indonesian Stocks",
      url: "https://query1.finance.yahoo.com/v8/finance/chart",
      key: null,
      // Yahoo rejects requests without a browser-like User-Agent, same as services/stocks.ts.
      probe: () => ({
        url: "https://query1.finance.yahoo.com/v8/finance/chart/%5EJKSE?range=1d&interval=1d",
        headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
      }),
    },
    {
      id: "myquran",
      name: "myQuran (Kemenag RI)",
      feature: "Prayer Times",
      url: "https://api.myquran.com/v3/sholat",
      key: null,
      probe: () => ({ url: "https://api.myquran.com/v3/sholat/kabkota/semua" }),
    },
    {
      id: "tanggalmerah",
      name: "Tanggal Merah",
      feature: "Public Holidays",
      url: "https://tanggalmerah.upset.dev/api",
      key: null,
      probe: () => ({ url: "https://tanggalmerah.upset.dev/api/years" }),
    },
    {
      id: "tmdb",
      name: "TMDB",
      feature: "Movies",
      url: "https://api.themoviedb.org/3",
      key: { required: true, configured: Boolean(serverEnv.tmdbReadToken || serverEnv.tmdbApiKey) },
      probe: tmdbProbe,
    },
    {
      id: "nvd",
      name: "NVD CVE API 2.0",
      feature: "CVE Monitoring",
      url: "https://services.nvd.nist.gov/rest/json/cves/2.0",
      key: { required: false, configured: Boolean(nvdKey) },
      probe: () => ({
        url: "https://services.nvd.nist.gov/rest/json/cves/2.0?resultsPerPage=1",
        headers: nvdKey ? { apiKey: nvdKey } : undefined,
        timeoutMs: 30_000,
        // Shares the NVD limiter with services/nvd.ts so the check never pushes the app over the limit.
        before: () => acquireSlot("nvd", nvdKey ? 45 : 5, 30_000, 15_000),
      }),
    },
    {
      id: "cisa-kev",
      name: "CISA KEV catalog",
      feature: "CVE Monitoring",
      url: "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json",
      key: null,
      probe: () => ({ url: "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json", timeoutMs: 20_000 }),
    },
    ...FEED_SOURCES.map<ApiDefinition>((feed) => ({
      id: `feed-${feed.id}`,
      name: feed.name,
      feature: `Technology News · ${feed.category}`,
      url: feed.url,
      key: null,
      probe: () => ({
        url: feed.url,
        headers: { "User-Agent": FEED_UA, Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml" },
      }),
    })),
  ];
}

function statusFor(code: number): ApiStatus {
  if (code < 400) return "up";
  if (code < 500) return "error";
  return "down";
}

async function check(def: ApiDefinition): Promise<ApiCheck> {
  const base = { id: def.id, name: def.name, feature: def.feature, url: def.url, usesApiKey: def.key !== null, key: def.key };
  const probe = def.probe();
  if (!probe) {
    return { ...base, status: "unconfigured", httpStatus: null, latencyMs: null, message: "API key not set, so no request was sent." };
  }

  try {
    await probe.before?.();
  } catch (error) {
    return { ...base, status: "error", httpStatus: null, latencyMs: null, message: error instanceof Error ? error.message : "Skipped" };
  }

  const started = performance.now();
  try {
    const res = await fetch(probe.url, {
      cache: "no-store",
      redirect: "follow",
      headers: probe.headers,
      signal: AbortSignal.timeout(probe.timeoutMs ?? DEFAULT_TIMEOUT),
    });
    const latencyMs = Math.round(performance.now() - started);
    // Only the status line matters; drop the body so large feeds are not downloaded.
    await res.body?.cancel().catch(() => undefined);
    const status = statusFor(res.status);
    return {
      ...base,
      status,
      httpStatus: res.status,
      latencyMs,
      message: status === "up" ? null : `HTTP ${res.status}${res.statusText ? ` ${res.statusText}` : ""}`,
    };
  } catch (error) {
    const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    return {
      ...base,
      status: "down",
      httpStatus: null,
      latencyMs: timedOut ? Math.round(performance.now() - started) : null,
      message: timedOut ? "No response before the timeout." : "Could not connect.",
    };
  }
}

type Run = { report: Omit<ApiMonitorReport, "cached">; at: number };
const state = ((globalThis as { __nhosApiMonitor?: { last: Run | null; inflight: Promise<Run> | null } }).__nhosApiMonitor ??= {
  last: null,
  inflight: null,
});

async function runAll(): Promise<Run> {
  const checks = await Promise.all(definitions().map(check));
  return { report: { checks, checkedAt: new Date().toISOString() }, at: Date.now() };
}

/**
 * Checks every external API nhOS depends on. Results are kept for a minute;
 * `force` re-runs the checks unless the last run is under 10 seconds old.
 */
export async function getApiMonitorReport({ force = false }: { force?: boolean } = {}): Promise<ApiMonitorReport> {
  const age = state.last ? Date.now() - state.last.at : Infinity;
  if (state.last && age < (force ? MIN_REFRESH_GAP : TTL)) return { ...state.last.report, cached: true };

  state.inflight ??= runAll().finally(() => {
    state.inflight = null;
  });
  const run = await state.inflight;
  state.last = run;
  return { ...run.report, cached: false };
}
