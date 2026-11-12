import "server-only";

import { subDays } from "date-fns";
import { cached } from "@/lib/memory-cache";
import { fetchWithRetry } from "@/lib/http";
import { acquireSlot } from "@/lib/rate-limit";
import { serverEnv } from "@/lib/server-env";
import type { Paginated, SourceMeta } from "@/types/api";
import type {
  AffectedProduct,
  CveDetail,
  CveOverview,
  CveSearchParams,
  CveSummary,
  SeverityOrUnscored,
} from "@/features/cve/types";
import { getKevIndexSafe, type KevIndex } from "@/services/kev";

/**
 * NIST National Vulnerability Database – CVE API 2.0
 * Docs: https://nvd.nist.gov/developers/vulnerabilities
 * Rate limits: 5 requests / 30 s without a key, 50 / 30 s with NVD_API_KEY.
 */
const API_URL = "https://services.nvd.nist.gov/rest/json/cves/2.0";
const SOURCE_URL = "https://nvd.nist.gov/developers/vulnerabilities";
const SEARCH_TTL = 10 * 60 * 1000;
const DETAIL_TTL = 60 * 60 * 1000;
const DEFAULT_WINDOW_DAYS = 7;

// Raw NVD types (subset we use)

type CvssData = {
  version: string;
  vectorString: string;
  baseScore: number;
  baseSeverity?: string;
  attackVector?: string;
  accessVector?: string;
  attackComplexity?: string;
  accessComplexity?: string;
  privilegesRequired?: string;
  userInteraction?: string;
};

type CvssMetric = {
  source: string;
  type: "Primary" | "Secondary";
  cvssData: CvssData;
  baseSeverity?: string;
  exploitabilityScore?: number;
  impactScore?: number;
};

type NvdCve = {
  id: string;
  published: string;
  lastModified: string;
  vulnStatus: string;
  descriptions: { lang: string; value: string }[];
  metrics?: {
    cvssMetricV40?: CvssMetric[];
    cvssMetricV31?: CvssMetric[];
    cvssMetricV30?: CvssMetric[];
    cvssMetricV2?: CvssMetric[];
  };
  weaknesses?: { description: { lang: string; value: string }[] }[];
  configurations?: { nodes: { cpeMatch: { vulnerable: boolean; criteria: string }[] }[] }[];
  affected?: { affectedData?: { vendor?: string; product?: string }[] }[];
  references?: { url: string; source: string; tags?: string[] }[];
  cisaExploitAdd?: string;
  cisaActionDue?: string;
  cisaRequiredAction?: string;
  cisaVulnerabilityName?: string;
};

type NvdResponse = {
  resultsPerPage: number;
  startIndex: number;
  totalResults: number;
  timestamp: string;
  vulnerabilities: { cve: NvdCve }[];
};

// Fetching with rate limiting + cache

async function nvdFetch(params: URLSearchParams): Promise<NvdResponse> {
  const apiKey = serverEnv.nvdApiKey;
  await acquireSlot("nvd", apiKey ? 45 : 5, 30_000, 15_000);
  const res = await fetchWithRetry(
    `${API_URL}?${params.toString()}`,
    { cache: "no-store", headers: apiKey ? { apiKey } : undefined },
    // NVD signals throttling with 403 as well as 429/503.
    { retries: 2, baseDelayMs: 2000, retryOn: [403, 429, 500, 502, 503, 504], timeoutMs: 30_000 },
  );
  if (res.status === 404) return { resultsPerPage: 0, startIndex: 0, totalResults: 0, timestamp: new Date().toISOString(), vulnerabilities: [] };
  if (res.status === 403 || res.status === 429) {
    throw Object.assign(new Error("NVD rate limit reached. Try again in about 30 seconds."), { status: 429 });
  }
  if (!res.ok) {
    const msg = res.headers.get("message");
    throw Object.assign(new Error(msg ? `NVD: ${msg}` : `NVD returned ${res.status}`), { status: res.status === 400 ? 400 : 502 });
  }
  return (await res.json()) as NvdResponse;
}

async function nvdCached(params: URLSearchParams, ttl: number) {
  params.sort();
  return cached(`nvd:${params.toString()}`, ttl, () => nvdFetch(params));
}

// Mapping

function pickMetric(cve: NvdCve): CvssMetric | null {
  const m = cve.metrics;
  if (!m) return null;
  for (const list of [m.cvssMetricV40, m.cvssMetricV31, m.cvssMetricV30, m.cvssMetricV2]) {
    if (list?.length) return list.find((x) => x.type === "Primary") ?? list[0] ?? null;
  }
  return null;
}

function severityOf(metric: CvssMetric | null): SeverityOrUnscored {
  const raw = (metric?.cvssData.baseSeverity ?? metric?.baseSeverity ?? "").toUpperCase();
  if (raw === "CRITICAL" || raw === "HIGH" || raw === "MEDIUM" || raw === "LOW" || raw === "NONE") return raw;
  return "UNSCORED";
}

function toSummary(cve: NvdCve, kev: KevIndex | null): CveSummary {
  const metric = pickMetric(cve);
  const kevEntry = kev?.byId.get(cve.id);
  return {
    id: cve.id,
    description: cve.descriptions.find((d) => d.lang === "en")?.value ?? cve.descriptions[0]?.value ?? "",
    published: cve.published,
    lastModified: cve.lastModified,
    status: cve.vulnStatus,
    cvssVersion: metric?.cvssData.version ?? null,
    cvssScore: metric?.cvssData.baseScore ?? null,
    severity: severityOf(metric),
    kev: Boolean(kevEntry || cve.cisaExploitAdd),
    kevDueDate: kevEntry?.dueDate ?? cve.cisaActionDue ?? null,
  };
}

/** NVD lists the same URL once per submitting source; merge their tags. */
function dedupeReferences(refs: NonNullable<NvdCve["references"]>) {
  const byUrl = new Map<string, { url: string; source: string; tags: string[] }>();
  for (const r of refs) {
    const existing = byUrl.get(r.url);
    if (existing) existing.tags = [...new Set([...existing.tags, ...(r.tags ?? [])])];
    else byUrl.set(r.url, { url: r.url, source: r.source, tags: [...(r.tags ?? [])] });
  }
  return [...byUrl.values()];
}

const productKey = (vendor: string, product: string) =>
  `${vendor}|${product}`.toLowerCase().replace(/[^a-z0-9|]/g, "");

const prettify = (s: string) => s.replace(/_/g, " ").replace(/\\/g, "");

function affectedOf(cve: NvdCve): AffectedProduct[] {
  const out = new Map<string, AffectedProduct>();
  for (const a of cve.affected ?? []) {
    for (const d of a.affectedData ?? []) {
      if (d.vendor && d.product && d.vendor !== "n/a") {
        out.set(productKey(d.vendor, d.product), { vendor: d.vendor, product: d.product, source: "cna" });
      }
    }
  }
  for (const conf of cve.configurations ?? []) {
    for (const node of conf.nodes) {
      for (const match of node.cpeMatch) {
        if (!match.vulnerable) continue;
        const [, , , vendor, product] = match.criteria.split(":");
        if (!vendor || !product) continue;
        const key = productKey(vendor, product);
        if (!out.has(key)) {
          out.set(key, { vendor: prettify(vendor), product: prettify(product), source: "cpe" });
        }
      }
    }
  }
  return [...out.values()].slice(0, 50);
}

// Public API

function isoStart(date: string) {
  return `${date}T00:00:00.000Z`;
}
function isoEnd(date: string) {
  return `${date}T23:59:59.999Z`;
}
/** Current time rounded down to 10 minutes so cache keys stay stable. */
function nowBucket() {
  const d = new Date();
  d.setUTCMinutes(Math.floor(d.getUTCMinutes() / 10) * 10, 0, 0);
  return d.toISOString();
}

function baseParams(p: Omit<CveSearchParams, "page" | "pageSize">): URLSearchParams {
  const params = new URLSearchParams();
  const from = p.from ?? subDays(new Date(), DEFAULT_WINDOW_DAYS).toISOString().slice(0, 10);
  params.set("pubStartDate", isoStart(from));
  params.set("pubEndDate", p.to ? isoEnd(p.to) : nowBucket());
  if (p.q) params.set("keywordSearch", p.q);
  if (p.severity && p.severity !== "NONE") params.set("cvssV3Severity", p.severity);
  if (p.vendor) {
    const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_.\-*]/g, "");
    params.set("virtualMatchString", `cpe:2.3:*:${norm(p.vendor)}:${p.product ? norm(p.product) : "*"}`);
  }
  return params;
}

function meta(fetchedAt: string, isCached: boolean, note?: string): SourceMeta {
  return {
    source: "NIST NVD",
    sourceUrl: SOURCE_URL,
    fetchedAt,
    freshness: isCached ? "cached" : "live",
    note: note ?? "Published-date window query against NVD CVE API 2.0, newest first. Cached for 10 minutes.",
  };
}

/** Total results for a query (cheap: resultsPerPage=1). */
async function countFor(params: URLSearchParams) {
  const p = new URLSearchParams(params);
  p.set("resultsPerPage", "1");
  p.set("startIndex", "0");
  return nvdCached(p, SEARCH_TTL);
}

/**
 * NVD returns oldest first. To list newest first we read the total, then
 * fetch the slice from the end and reverse it.
 */
export async function searchCves(p: CveSearchParams): Promise<{ data: Paginated<CveSummary>; meta: SourceMeta }> {
  const params = baseParams(p);
  const [count, kev] = await Promise.all([countFor(params), getKevIndexSafe()]);
  const total = count.value.totalResults;
  const totalPages = Math.max(1, Math.ceil(total / p.pageSize));
  const page = Math.min(p.page, totalPages);

  if (total === 0) {
    return { data: { items: [], page: 1, pageSize: p.pageSize, total: 0, totalPages: 1 }, meta: meta(count.fetchedAt, count.cached) };
  }

  const end = total - (page - 1) * p.pageSize;
  const start = Math.max(0, end - p.pageSize);
  const pageParams = new URLSearchParams(params);
  pageParams.set("startIndex", String(start));
  pageParams.set("resultsPerPage", String(end - start));
  const res = await nvdCached(pageParams, SEARCH_TTL);

  let items = res.value.vulnerabilities.map((v) => toSummary(v.cve, kev)).reverse();
  let note: string | undefined;
  if (p.minScore !== undefined) {
    items = items.filter((i) => i.cvssScore !== null && i.cvssScore >= p.minScore!);
    note = "NVD has no CVSS score filter; the minimum score is applied to the CVEs on this page.";
  }

  return {
    data: { items, page, pageSize: p.pageSize, total, totalPages },
    meta: meta(res.fetchedAt, res.cached && count.cached, note),
  };
}

export async function getCveDetail(id: string): Promise<{ data: CveDetail | null; meta: SourceMeta }> {
  const params = new URLSearchParams({ cveId: id.toUpperCase() });
  const [res, kev] = await Promise.all([nvdCached(params, DETAIL_TTL), getKevIndexSafe()]);
  const cve = res.value.vulnerabilities[0]?.cve;
  const m = meta(res.fetchedAt, res.cached, "CVE record from NVD CVE API 2.0. Cached for 1 hour.");
  if (!cve) return { data: null, meta: m };

  const metric = pickMetric(cve);
  const kevEntry = kev?.byId.get(cve.id);
  const d = metric?.cvssData;
  const hasKev = Boolean(kevEntry || cve.cisaExploitAdd);

  return {
    data: {
      ...toSummary(cve, kev),
      vectorString: d?.vectorString ?? null,
      attackVector: d?.attackVector ?? d?.accessVector ?? null,
      attackComplexity: d?.attackComplexity ?? d?.accessComplexity ?? null,
      privilegesRequired: d?.privilegesRequired ?? null,
      userInteraction: d?.userInteraction ?? null,
      exploitabilityScore: metric?.exploitabilityScore ?? null,
      impactScore: metric?.impactScore ?? null,
      metricSource: metric ? `${metric.source} (${metric.type})` : null,
      weaknesses: [
        ...new Set(
          (cve.weaknesses ?? []).flatMap((w) => w.description.map((x) => x.value)).filter((v) => v.startsWith("CWE-")),
        ),
      ],
      affected: affectedOf(cve),
      references: dedupeReferences(cve.references ?? []),
      kevInfo: hasKev
        ? {
            dateAdded: kevEntry?.dateAdded ?? cve.cisaExploitAdd ?? null,
            dueDate: kevEntry?.dueDate ?? cve.cisaActionDue ?? null,
            requiredAction: kevEntry?.requiredAction ?? cve.cisaRequiredAction ?? null,
            vulnerabilityName: kevEntry?.vulnerabilityName ?? cve.cisaVulnerabilityName ?? null,
          }
        : null,
    },
    meta: m,
  };
}

export async function getCveOverview(): Promise<{ data: CveOverview; meta: SourceMeta }> {
  const params = baseParams({});
  const crit = new URLSearchParams(params);
  crit.set("cvssV3Severity", "CRITICAL");
  const high = new URLSearchParams(params);
  high.set("cvssV3Severity", "HIGH");

  const [latest, critical, highCount, kev] = await Promise.all([
    searchCves({ page: 1, pageSize: 20 }),
    countFor(crit),
    countFor(high),
    getKevIndexSafe(),
  ]);

  const cutoff = subDays(new Date(), 30).toISOString().slice(0, 10);
  return {
    data: {
      windowDays: DEFAULT_WINDOW_DAYS,
      total: latest.data.total,
      critical: critical.value.totalResults,
      high: highCount.value.totalResults,
      latest: latest.data.items.slice(0, 6),
      kevAddedLast30Days: kev ? kev.entries.filter((e) => e.dateAdded >= cutoff).length : 0,
    },
    meta: {
      ...latest.meta,
      note: `CVEs published in the last ${DEFAULT_WINDOW_DAYS} days (NVD). Severity counts use CVSS v3 severity.`,
    },
  };
}
