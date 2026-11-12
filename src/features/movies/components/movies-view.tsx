"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { SourceBadge } from "@/components/shared/source-badge";
import { ALL_GENRES, GenreFilter } from "@/features/movies/components/genre-filter";
import { MovieDetailDialog } from "@/features/movies/components/movie-detail-dialog";
import { MovieHero, MovieHeroSkeleton } from "@/features/movies/components/movie-hero";
import { MovieRail } from "@/features/movies/components/movie-rail";
import { TrailerDialog, type TrailerRequest } from "@/features/movies/components/trailer-dialog";
import { useMovieList } from "@/features/movies/hooks";
import type { MovieSummary } from "@/features/movies/types";

export function MoviesView() {
  const nowPlaying = useMovieList("now_playing");
  const upcoming = useMovieList("upcoming");
  const [selected, setSelected] = useState<MovieSummary | null>(null);
  const [genre, setGenre] = useState<string>(ALL_GENRES);
  const [trailer, setTrailer] = useState<TrailerRequest | null>(null);

  // The detail dialog hands over to the player rather than stacking two dialogs.
  const playTrailer = (t: TrailerRequest) => {
    setSelected(null);
    setTrailer(t);
  };

  const nowItems = nowPlaying.data?.data.items;
  const upcomingItems = upcoming.data?.data.items;

  const genres = useMemo(() => {
    const counts = new Map<string, number>();
    for (const m of [...(nowItems ?? []), ...(upcomingItems ?? [])]) {
      for (const g of m.genres) counts.set(g, (counts.get(g) ?? 0) + 1);
    }
    return [...counts].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [nowItems, upcomingItems]);

  const byGenre = (items: MovieSummary[] | undefined) =>
    genre === ALL_GENRES ? items : items?.filter((m) => m.genres.includes(genre));
  const nowFiltered = byGenre(nowItems);
  const upcomingFiltered = byGenre(upcomingItems);

  const featured = nowFiltered?.find((m) => m.backdropUrl);
  const filtering = genre !== ALL_GENRES;
  const clearFilter = filtering ? (
    <Button variant="outline" size="sm" onClick={() => setGenre(ALL_GENRES)}>Show all genres</Button>
  ) : undefined;

  return (
    <div className="space-y-8">
      {(nowItems || upcomingItems) && <GenreFilter genres={genres} value={genre} onChange={setGenre} />}

      {nowPlaying.isLoading ? <MovieHeroSkeleton /> : featured && (
          <MovieHero
            movie={featured}
            onMoreInfo={() => setSelected(featured)}
            onPlayTrailer={playTrailer}
            trailerSuspended={trailer !== null || selected !== null}
          />
        )}

      <MovieRail
        id="now-playing"
        title="Now showing"
        description="In Indonesian cinemas now, most popular first"
        movies={nowFiltered}
        isLoading={nowPlaying.isLoading}
        error={nowPlaying.error}
        onRetry={() => void nowPlaying.refetch()}
        emptyText={
          filtering
            ? `No ${genre.toLowerCase()} films are showing in Indonesian cinemas right now.`
            : "TMDB lists no theatrical releases in Indonesia over the last 45 days."
        }
        emptyAction={clearFilter}
        onSelect={setSelected}
      />

      <MovieRail
        id="upcoming"
        title="Coming soon"
        description="Indonesian release dates in the next 120 days, soonest first"
        movies={upcomingFiltered}
        isLoading={upcoming.isLoading}
        error={upcoming.error}
        onRetry={() => void upcoming.refetch()}
        emptyText={
          filtering
            ? `No ${genre.toLowerCase()} films have an Indonesian release date in the next 120 days.`
            : "TMDB has no Indonesian release dates scheduled for the next 120 days."
        }
        emptyAction={clearFilter}
        showDateChip
        onSelect={setSelected}
      />

      <footer className="flex flex-col gap-2 border-t pt-4 text-[11px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
        <SourceBadge meta={nowPlaying.data?.meta ?? upcoming.data?.meta} />
      </footer>

      <MovieDetailDialog movie={selected} onOpenChange={(open) => !open && setSelected(null)} onPlayTrailer={playTrailer} />
      <TrailerDialog trailer={trailer} onOpenChange={(open) => !open && setTrailer(null)} />
    </div>
  );
}
