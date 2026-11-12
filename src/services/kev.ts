import "server-only";

import { APP_NAME } from "@/lib/env";
import { cached, getStale } from "@/lib/memory-cache";
import { fetchWithRetry } from "@/lib/http";
import type { SourceMeta } from "@/types/api";
import type { KevEntry } from "@/features/cve/types";

/**
 * CISA Known Exploited Vulnerabilities catalog (public JSON feed).
 * https://www.cisa.gov/known-exploited-vulnerabilities-catalog
 */
const FEED_URL = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json";
const SOURCE_URL = "https://www.cisa.gov/known-exploited-vulnerabilities-catalog";
const TTL = 6 * 60 * 60 * 1000;
const KEY = "kev:catalog";

type KevCatalog = {
  title: string;
  catalogVersion: string;
  dateReleased: string;
  count: number;
  vulnerabilities: KevEntry[];
};

export type KevIndex = {
  catalogVersion: string;
  dateReleased: string;
  entries: KevEntry[];
  byId: Map<string, KevEntry>;
};

async function load(): Promise<KevIndex> {
  const res = await fetchWithRetry(FEED_URL, { cache: "no-store" }, { timeoutMs: 30_000 });
  if (!res.ok) throw Object.assign(new Error(`CISA KEV feed returned ${res.status}`), { status: 502 });
  const catalog = (await res.json()) as KevCatalog;
  const entries = [...catalog.vulnerabilities].sort((a, b) => b.dateAdded.localeCompare(a.dateAdded));
  return {
    catalogVersion: catalog.catalogVersion,
    dateReleased: catalog.dateReleased,
    entries,
    byId: new Map(entries.map((e) => [e.cveID, e])),
  };
}

export async function getKev(): Promise<{ index: KevIndex; meta: SourceMeta }> {
  try {
    const res = await cached(KEY, TTL, load);
    return {
      index: res.value,
      meta: {
        source: "CISA KEV Catalog",
        sourceUrl: SOURCE_URL,
        fetchedAt: res.fetchedAt,
        sourceUpdatedAt: res.value.dateReleased,
        freshness: res.cached ? "cached" : "live",
        note: `Catalog version ${res.value.catalogVersion}. Refreshed by ${APP_NAME} every 6 hours.`,
      },
    };
  } catch (error) {
    const stale = getStale<KevIndex>(KEY);
    if (!stale) throw error;
    return {
      index: stale.value,
      meta: {
        source: "CISA KEV Catalog",
        sourceUrl: SOURCE_URL,
        fetchedAt: stale.fetchedAt,
        sourceUpdatedAt: stale.value.dateReleased,
        freshness: "stale",
        note: "CISA feed is unreachable; showing the last successfully fetched catalog.",
      },
    };
  }
}

/** KEV lookup that never fails the caller (KEV flags are an enrichment). */
export async function getKevIndexSafe(): Promise<KevIndex | null> {
  try {
    return (await getKev()).index;
  } catch {
    return null;
  }
}
