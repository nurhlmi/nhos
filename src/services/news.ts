import "server-only";

import { APP_NAME } from "@/lib/env";
import { createHash } from "node:crypto";
import { XMLParser } from "fast-xml-parser";
import { cached, getStale } from "@/lib/memory-cache";
import { fetchWithRetry } from "@/lib/http";
import type { SourceMeta } from "@/types/api";
import { FEED_SOURCES, type FeedSource, type FeedStatus, type NewsArticle } from "@/features/news/feeds";

const TTL = 20 * 60 * 1000;
const MAX_PER_FEED = 25;
const USER_AGENT = `${APP_NAME.replace(/\s+/g, "-")}/1.0 (personal RSS reader)`;

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  htmlEntities: true,
  processEntities: true,
  isArray: (name) => ["item", "entry", "link", "media:content", "media:thumbnail", "enclosure", "category"].includes(name),
});

type Node = Record<string, unknown>;
const asNode = (v: unknown): Node | null => (v && typeof v === "object" && !Array.isArray(v) ? (v as Node) : null);
const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : v === undefined || v === null ? [] : [v]);

function text(v: unknown): string {
  if (v === undefined || v === null) return "";
  if (typeof v === "string" || typeof v === "number") return String(v);
  if (Array.isArray(v)) return text(v[0]);
  const n = asNode(v);
  return n ? text(n["#text"]) : "";
}

const ENTITY: Record<string, string> = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&nbsp;": " " };

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (m) => ENTITY[m] ?? m)
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d)))
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(s: string, n: number) {
  return s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s;
}

function httpUrl(v: string | undefined | null): string | null {
  if (!v) return null;
  try {
    const u = new URL(v.trim());
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

/** Image published inside the feed item itself (no page scraping). */
function imageFrom(item: Node, html: string): string | null {
  for (const key of ["media:content", "media:thumbnail"]) {
    for (const m of asArray(item[key])) {
      const n = asNode(m);
      const url = n?.["@_url"];
      const medium = n?.["@_medium"];
      const type = String(n?.["@_type"] ?? "");
      if (typeof url === "string" && (key === "media:thumbnail" || medium === "image" || type.startsWith("image") || !type)) {
        const u = httpUrl(url);
        if (u) return u;
      }
    }
  }
  const group = asNode(item["media:group"]);
  if (group) {
    const nested = imageFrom(group, "");
    if (nested) return nested;
  }
  for (const e of asArray(item.enclosure)) {
    const n = asNode(e);
    if (n && String(n["@_type"] ?? "").startsWith("image")) {
      const u = httpUrl(String(n["@_url"] ?? ""));
      if (u) return u;
    }
  }
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return httpUrl(match?.[1]);
}

function atomLink(entry: Node): string | null {
  const links = asArray(entry.link).map(asNode).filter((n): n is Node => Boolean(n));
  const alt = links.find((l) => !l["@_rel"] || l["@_rel"] === "alternate") ?? links[0];
  return httpUrl(String(alt?.["@_href"] ?? ""));
}

function toIso(v: string): string | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function parseFeed(xml: string, source: FeedSource): NewsArticle[] {
  const doc = parser.parse(xml) as Node;
  const rss = asNode(doc.rss);
  const channel = asNode(rss?.channel) ?? asNode(asNode(doc["rdf:RDF"])?.channel);
  const rdfItems = asArray(asNode(doc["rdf:RDF"])?.item);
  const feed = asNode(doc.feed);

  const rawItems: Node[] = (channel ? asArray(channel.item) : feed ? asArray(feed.entry) : rdfItems)
    .map(asNode)
    .filter((n): n is Node => Boolean(n));

  return rawItems
    .slice(0, MAX_PER_FEED)
    .map((item) => {
      const isAtom = Boolean(feed);
      const html = text(item["content:encoded"]) || text(item.description) || text(item.summary) || text(item.content);
      const url = isAtom ? atomLink(item) : httpUrl(text(item.link) || text(item.guid));
      const title = stripHtml(text(item.title));
      if (!url || !title) return null;
      return {
        id: createHash("sha1").update(url).digest("hex").slice(0, 16),
        title,
        description: truncate(stripHtml(html), 320),
        url,
        imageUrl: imageFrom(item, html),
        publishedAt: toIso(text(item.pubDate) || text(item.published) || text(item.updated) || text(item["dc:date"])),
        source: source.name,
        sourceId: source.id,
        sourceHomepage: source.homepage,
        category: source.category,
      } satisfies NewsArticle;
    })
    .filter((a): a is NewsArticle => a !== null);
}

async function fetchFeed(source: FeedSource): Promise<NewsArticle[]> {
  const key = `news:${source.id}`;
  try {
    const res = await cached(key, TTL, async () => {
      const r = await fetchWithRetry(
        source.url,
        { cache: "no-store", headers: { "User-Agent": USER_AGENT, Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml" } },
        { retries: 1, timeoutMs: 12_000 },
      );
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return parseFeed(await r.text(), source);
    });
    return res.value;
  } catch (error) {
    const stale = getStale<NewsArticle[]>(key);
    if (stale) return stale.value;
    throw error;
  }
}

export async function getNews(): Promise<{ data: { articles: NewsArticle[]; feeds: FeedStatus[] }; meta: SourceMeta }> {
  const started = Date.now();
  const results = await Promise.allSettled(FEED_SOURCES.map(fetchFeed));
  const feeds: FeedStatus[] = [];
  const seen = new Set<string>();
  const articles: NewsArticle[] = [];

  results.forEach((r, i) => {
    const source = FEED_SOURCES[i]!;
    if (r.status === "fulfilled") {
      feeds.push({ id: source.id, name: source.name, ok: true, count: r.value.length });
      for (const a of r.value) {
        if (seen.has(a.url)) continue;
        seen.add(a.url);
        articles.push(a);
      }
    } else {
      feeds.push({ id: source.id, name: source.name, ok: false, count: 0, error: r.reason instanceof Error ? r.reason.message : "Failed" });
    }
  });

  if (feeds.every((f) => !f.ok)) {
    throw Object.assign(new Error("All news feeds are unreachable right now."), { status: 502 });
  }

  articles.sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
  const failed = feeds.filter((f) => !f.ok).length;

  return {
    data: { articles, feeds },
    meta: {
      source: `${feeds.length - failed} publisher RSS/Atom feeds`,
      sourceUrl: "/news#sources",
      fetchedAt: new Date().toISOString(),
      freshness: Date.now() - started < 300 ? "cached" : "live",
      note: `Each feed is cached for 20 minutes.${failed ? ` ${failed} feed(s) unavailable.` : ""}`,
    },
  };
}
