"use client";

import { Info, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BackgroundTrailer } from "@/features/movies/components/background-trailer";
import { MovieImage } from "@/features/movies/components/movie-poster";
import type { TrailerRequest } from "@/features/movies/components/trailer-dialog";
import { movieMeta } from "@/features/movies/format";
import { useMovieDetail } from "@/features/movies/hooks";
import type { MovieSummary } from "@/features/movies/types";

// Tall enough for the trailer to carry the screen (16:9 on tablets, 2:1 on desktop), capped so the rails still peek above the fold.
const FRAME = "relative overflow-hidden rounded-xl min-h-[30rem] sm:min-h-0 sm:aspect-video lg:aspect-[2/1] sm:max-h-[78vh]";

/**
 * Billboard for the most popular film now in Indonesian cinemas, with its
 * trailer playing muted behind the text. The frame stays dark in both themes:
 * the black gradient exists so white text keeps contrast over any frame of the
 * image or video.
 */
export function MovieHero({
  movie,
  onMoreInfo,
  onPlayTrailer,
  trailerSuspended,
}: {
  movie: MovieSummary;
  onMoreInfo: () => void;
  onPlayTrailer: (trailer: TrailerRequest) => void;
  /** True while another trailer is playing (player or detail dialog), so two never play at once. */
  trailerSuspended: boolean;
}) {
  const detail = useMovieDetail(movie.id);
  const trailerKey = detail.data?.data.trailerKey;
  const meta = movieMeta(movie);
  // The detail carries the Indonesian synopsis when TMDB has one.
  const overview = detail.data?.data.overview || movie.overview;

  return (
    <section aria-labelledby="movie-hero-title" className={`${FRAME} bg-black text-white`}>
      <MovieImage src={movie.backdropUrl} className="absolute inset-0 size-full" />
      {trailerKey && (
        <BackgroundTrailer
          key={trailerKey}
          videoKey={trailerKey}
          title={movie.title}
          suspended={trailerSuspended}
          controlsClassName="top-4 right-4 sm:top-auto sm:right-6 sm:bottom-6"
        />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/10 sm:bg-gradient-to-r sm:from-black/90 sm:via-black/55 sm:to-transparent" />
      <div className="relative flex h-full min-h-[30rem] flex-col justify-end gap-3 p-5 sm:min-h-0 sm:max-w-xl sm:p-8 lg:p-12">
        <p className="text-xs font-medium text-white/80">Most popular in Indonesian cinemas</p>
        <h2 id="movie-hero-title" className="text-2xl leading-tight font-semibold tracking-tight text-balance sm:text-3xl lg:text-4xl">
          {movie.title}
        </h2>
        {meta.length > 0 && <p className="text-sm text-white/85">{[...meta, ...movie.genres.slice(0, 2)].join(" · ")}</p>}
        {overview && <p className="line-clamp-3 text-sm leading-relaxed text-white/85">{overview}</p>}
        <div className="mt-1 flex flex-wrap gap-2">
          {detail.isLoading ? (
            <Skeleton className="h-9 w-36 bg-white/15" />
          ) : (
            trailerKey && (
              <Button size="lg" className="px-4" onClick={() => onPlayTrailer({ key: trailerKey, title: movie.title })}>
                <Play className="fill-current" /> Watch trailer
              </Button>
            )
          )}
          <Button size="lg" onClick={onMoreInfo} className="bg-white/15 px-4 text-white hover:bg-white/25">
            <Info /> More info
          </Button>
        </div>
      </div>
    </section>
  );
}

export function MovieHeroSkeleton() {
  return <Skeleton className={FRAME} aria-label="Loading featured film" />;
}
