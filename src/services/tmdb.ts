import "server-only";

import { addDays, format, subDays } from "date-fns";
import { cached, getStale, type CachedResult } from "@/lib/memory-cache";
import { fetchWithRetry } from "@/lib/http";
import { serverEnv } from "@/lib/server-env";
import type { SourceMeta } from "@/types/api";
import { type MovieDetail, type MovieList, type MovieListData, type MovieSummary } from "@/features/movies/types";

/**
 * TMDB (developer.themoviedb.org). Lists come from /discover/movie with
 * region=ID, which filters on Indonesian release dates; the Indonesian date and
 * age rating are then read from each film's /release_dates. Rate limit is
 * roughly 50 requests/s, so a few hours of caching keeps the page cheap.
 */
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE = "https://image.tmdb.org/t/p";
const SOURCE = "TMDB";
const SOURCE_URL = "https://www.themoviedb.org";
const NOTE = "This product uses the TMDB API but is not endorsed or certified by TMDB.";
const REGION = "ID";
/**
 * Titles come from en-US: with id-ID, TMDB falls back to the original-language
 * title (Japanese, Hindi script) whenever no Indonesian translation exists,
 * while Indonesian cinemas bill imports by their English title. Indonesian
 * films keep their original title. Synopses prefer Indonesian.
 */
const TITLE_LANGUAGE = "en-US";
const OVERVIEW_LANGUAGE = "id-ID";
const LIST_TTL = 6 * 60 * 60 * 1000;
const DETAIL_TTL = 24 * 60 * 60 * 1000;
const GENRE_TTL = 7 * 24 * 60 * 60 * 1000;
/** Films still in Indonesian cinemas are rarely older than this. */
const NOW_PLAYING_WINDOW_DAYS = 45;
const UPCOMING_WINDOW_DAYS = 120;
/** TMDB returns 20 per page; five pages covers the full Indonesian slate (~80 films) so the genre filter sees every film. */
const PAGES = 5;

class UpstreamError extends Error {
  constructor(message: string, public readonly status = 502) {
    super(message);
  }
}

type TmdbMovie = {
  id: number;
  title: string;
  original_title: string;
  original_language: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  overview: string;
};
type TmdbPage = { results: TmdbMovie[]; total_pages: number };
type TmdbReleaseDates = {
  results: { iso_3166_1: string; release_dates: { certification: string; release_date: string; type: number }[] }[];
};
type TmdbDetail = TmdbMovie & {
  runtime: number | null;
  tagline: string;
  videos?: { results: { site: string; key: string; type: string; official: boolean; iso_639_1: string }[] };
  credits?: { cast: { name: string; order: number }[]; crew: { name: string; job: string }[] };
  release_dates?: TmdbReleaseDates;
};

function authorize(params: URLSearchParams): HeadersInit {
  if (serverEnv.tmdbReadToken) return { Authorization: `Bearer ${serverEnv.tmdbReadToken}` };
  if (serverEnv.tmdbApiKey) {
    params.set("api_key", serverEnv.tmdbApiKey);
    return {};
  }
  throw new UpstreamError("TMDB is not configured. Set TMDB_API_READ_TOKEN in .env.local and restart the server.", 503);
}

async function get<T>(path: string, query: Record<string, string> = {}): Promise<T> {
  const params = new URLSearchParams(query);
  const headers = authorize(params);
  let res: Response;
  try {
    res = await fetchWithRetry(`${BASE_URL}${path}?${params}`, { headers: { Accept: "application/json", ...headers }, cache: "no-store" });
  } catch {
    throw new UpstreamError("Could not reach api.themoviedb.org. Try again in a moment.");
  }
  if (res.status === 401) throw new UpstreamError("TMDB rejected the API credentials. Check TMDB_API_READ_TOKEN.", 502);
  if (res.status === 404) throw new UpstreamError("TMDB has no film with this id.", 404);
  if (!res.ok) throw new UpstreamError(`TMDB returned ${res.status}`);
  return (await res.json()) as T;
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

function meta(result: CachedResult<unknown> & { stale: boolean }): SourceMeta {
  return {
    source: SOURCE,
    sourceUrl: SOURCE_URL,
    fetchedAt: result.fetchedAt,
    freshness: result.stale ? "stale" : result.cached ? "cached" : "live",
    note: NOTE,
  };
}

const image = (path: string | null, size: string) => (path ? `${IMAGE_BASE}/${size}${path}` : null);

/** Today in Jakarta, so the cut-off between "now showing" and "coming soon" matches local cinemas. */
function jakartaToday(): Date {
  const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
  return new Date(`${ymd}T00:00:00`);
}
const ymd = (d: Date) => format(d, "yyyy-MM-dd");

async function genreMap(): Promise<Map<number, string>> {
  const { value } = await withStale("tmdb:genres", GENRE_TTL, async () =>
    (await get<{ genres: { id: number; name: string }[] }>("/genre/movie/list", { language: "en-US" })).genres,
  );
  return new Map(value.map((g) => [g.id, g.name]));
}

/** Indonesian theatrical release (type 3, else limited type 2) and its age rating. */
function indonesianRelease(dates: TmdbReleaseDates | undefined): { date: string | null; certification: string | null } {
  const id = dates?.results.find((r) => r.iso_3166_1 === REGION)?.release_dates ?? [];
  const theatrical = id.filter((d) => d.type === 3).length ? id.filter((d) => d.type === 3) : id.filter((d) => d.type === 2);
  const first = [...theatrical].sort((a, b) => a.release_date.localeCompare(b.release_date))[0];
  const certification = id.map((d) => d.certification.trim()).find(Boolean) ?? null;
  return { date: first ? first.release_date.slice(0, 10) : null, certification };
}

/** Runs async work over items with a small concurrency cap. */
async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i]!);
      }
    }),
  );
  return out;
}

function summary(m: TmdbMovie, genres: Map<number, string>, release: { date: string | null; certification: string | null }): MovieSummary {
  return {
    id: m.id,
    title: m.original_language === "id" ? m.original_title : m.title,
    originalTitle: m.original_title,
    posterUrl: image(m.poster_path, "w342"),
    backdropUrl: image(m.backdrop_path, "w1280"),
    releaseDate: release.date ?? (m.release_date || null),
    certification: release.certification,
    voteAverage: m.vote_average,
    voteCount: m.vote_count,
    genres: m.genres?.map((g) => g.name) ?? (m.genre_ids ?? []).map((id) => genres.get(id)).filter((g): g is string => !!g),
    overview: m.overview,
  };
}

async function loadList(list: MovieList): Promise<MovieSummary[]> {
  const today = jakartaToday();
  const range =
    list === "now_playing"
      ? { gte: ymd(subDays(today, NOW_PLAYING_WINDOW_DAYS)), lte: ymd(today) }
      : { gte: ymd(addDays(today, 1)), lte: ymd(addDays(today, UPCOMING_WINDOW_DAYS)) };
  const query = {
    region: REGION,
    language: TITLE_LANGUAGE,
    include_adult: "false",
    with_release_type: "2|3",
    "release_date.gte": range.gte,
    "release_date.lte": range.lte,
    sort_by: "popularity.desc",
  };

  const first = await get<TmdbPage>("/discover/movie", { ...query, page: "1" });
  const rest = await Promise.all(
    Array.from({ length: Math.min(PAGES, first.total_pages) - 1 }, (_, i) =>
      get<TmdbPage>("/discover/movie", { ...query, page: String(i + 2) }),
    ),
  );
  const movies = [...new Map([first, ...rest].flatMap((p) => p.results).map((m) => [m.id, m])).values()];
  const [genres, releases] = await Promise.all([
    genreMap(),
    mapLimit(movies, 8, (m) => get<TmdbReleaseDates>(`/movie/${m.id}/release_dates`).catch(() => undefined)),
  ]);

  const items = movies.map((m, i) => summary(m, genres, indonesianRelease(releases[i])));
  if (list === "now_playing") return items.filter((m) => !m.releaseDate || m.releaseDate <= range.lte);
  return items
    .filter((m) => !m.releaseDate || m.releaseDate >= range.gte)
    .sort((a, b) => (a.releaseDate ?? "9999").localeCompare(b.releaseDate ?? "9999"));
}

export async function getMovieList(list: MovieList): Promise<{ data: MovieListData; meta: SourceMeta }> {
  const result = await withStale(`tmdb:list:v3:${list}`, LIST_TTL, () => loadList(list));
  return { data: { list, items: result.value }, meta: meta(result) };
}

function pickTrailer(videos: TmdbDetail["videos"]): string | null {
  const youtube = (videos?.results ?? []).filter((v) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser"));
  const ranked = youtube.sort(
    (a, b) =>
      Number(b.type === "Trailer") - Number(a.type === "Trailer") ||
      Number(b.official) - Number(a.official),
  );
  return ranked[0]?.key ?? null;
}

export async function getMovieDetail(id: number): Promise<{ data: MovieDetail; meta: SourceMeta }> {
  const result = await withStale(`tmdb:movie:v4:${id}`, DETAIL_TTL, async (): Promise<MovieDetail> => {
    const [d, localized] = await Promise.all([
      get<TmdbDetail>(`/movie/${id}`, {
        language: TITLE_LANGUAGE,
        append_to_response: "videos,credits,release_dates",
        // Indonesian trailers are rare; include English ones too.
        include_video_language: "id,en,null",
      }),
      get<TmdbMovie>(`/movie/${id}`, { language: OVERVIEW_LANGUAGE }).catch(() => null),
    ]);
    // Indonesian synopsis when TMDB has one, English otherwise.
    const overview = localized?.overview || d.overview || "";
    return {
      ...summary({ ...d, overview }, new Map(), indonesianRelease(d.release_dates)),
      runtime: d.runtime || null,
      tagline: d.tagline || null,
      directors: (d.credits?.crew ?? []).filter((c) => c.job === "Director").map((c) => c.name),
      cast: [...(d.credits?.cast ?? [])].sort((a, b) => a.order - b.order).slice(0, 6).map((c) => c.name),
      trailerKey: pickTrailer(d.videos),
      tmdbUrl: `https://www.themoviedb.org/movie/${d.id}`,
    };
  });
  return { data: result.value, meta: meta(result) };
}
