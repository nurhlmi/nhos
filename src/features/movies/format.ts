import { formatDate } from "@/utils/format";
import type { MovieSummary } from "@/features/movies/types";

/** TMDB score is shown only once enough people have voted for it to mean something. */
export const MIN_VOTES = 20;

export function movieMeta(m: MovieSummary, { withDate = true }: { withDate?: boolean } = {}): string[] {
  const parts: string[] = [];
  if (m.voteCount >= MIN_VOTES) parts.push(`TMDB ${m.voteAverage.toFixed(1)}`);
  if (withDate && m.releaseDate) parts.push(formatDate(m.releaseDate));
  if (m.certification) parts.push(m.certification);
  return parts;
}

export function formatRuntime(minutes: number | null): string | null {
  if (!minutes) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}
