"use client";

import { ExternalLink, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/states";
import { BackgroundTrailer } from "@/features/movies/components/background-trailer";
import { MovieImage } from "@/features/movies/components/movie-poster";
import { formatRuntime, movieMeta } from "@/features/movies/format";
import { useMovieDetail } from "@/features/movies/hooks";
import type { MovieSummary } from "@/features/movies/types";
import type { TrailerRequest } from "@/features/movies/components/trailer-dialog";

/**
 * Opens with the list data straight away and fills in runtime, credits and
 * trailer when the detail arrives. The trailer then plays in the header with
 * sound, since opening the detail is the visitor asking about this film.
 */
export function MovieDetailDialog({
  movie,
  onOpenChange,
  onPlayTrailer,
}: {
  movie: MovieSummary | null;
  onOpenChange: (open: boolean) => void;
  onPlayTrailer: (trailer: TrailerRequest) => void;
}) {
  const detail = useMovieDetail(movie?.id ?? null);
  const d = detail.data?.data;
  const m = d ?? movie;

  return (
    <Dialog open={!!movie} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto p-0 sm:max-w-2xl [&>[data-slot=dialog-close]]:bg-black/60 [&>[data-slot=dialog-close]]:text-white [&>[data-slot=dialog-close]]:hover:bg-black/80">
        {m && (
          <>
            <div className="relative aspect-video overflow-hidden bg-black">
              <MovieImage src={m.backdropUrl ?? m.posterUrl} className="absolute inset-0 size-full" />
              {d?.trailerKey && (
                <BackgroundTrailer
                  key={d.trailerKey}
                  videoKey={d.trailerKey}
                  title={d.title}
                  startMuted={false}
                  controlsClassName="right-3 bottom-3"
                />
              )}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-popover to-transparent" />
            </div>
            <div className="space-y-4 p-5 sm:p-6">
              <div className="space-y-1.5">
                <DialogTitle className="text-xl leading-tight font-semibold tracking-tight sm:text-2xl">{m.title}</DialogTitle>
                {m.originalTitle !== m.title && <p className="text-sm text-muted-foreground">{m.originalTitle}</p>}
                <p className="text-sm text-muted-foreground">
                  {[...movieMeta(m), formatRuntime(d?.runtime ?? null)].filter(Boolean).join(" · ")}
                </p>
                {m.genres.length > 0 && (
                  <ul className="flex flex-wrap gap-1.5 pt-1" aria-label="Genres">
                    {m.genres.map((g) => (
                      <li key={g} className="rounded-md border px-2 py-0.5 text-xs text-muted-foreground">{g}</li>
                    ))}
                  </ul>
                )}
              </div>

              {d?.tagline && <p className="text-sm italic text-muted-foreground">{d.tagline}</p>}
              <DialogDescription className="text-sm leading-relaxed text-foreground">
                {m.overview || "TMDB has no synopsis for this film yet."}
              </DialogDescription>

              {detail.isLoading ? (
                <div className="space-y-2" aria-busy="true" aria-label="Loading credits">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : detail.error ? (
                <ErrorState compact title="Could not load credits and trailer" error={detail.error} onRetry={() => void detail.refetch()} />
              ) : (
                d && (
                  <dl className="grid gap-2 text-sm sm:grid-cols-[6rem_1fr]">
                    {d.directors.length > 0 && (
                      <>
                        <dt className="text-muted-foreground">Director</dt>
                        <dd>{d.directors.join(", ")}</dd>
                      </>
                    )}
                    {d.cast.length > 0 && (
                      <>
                        <dt className="text-muted-foreground">Cast</dt>
                        <dd>{d.cast.join(", ")}</dd>
                      </>
                    )}
                  </dl>
                )
              )}

              <div className="flex flex-wrap gap-2 pt-1">
                {d?.trailerKey && (
                  <Button onClick={() => onPlayTrailer({ key: d.trailerKey!, title: d.title })}>
                    <Play className="fill-current" /> Watch trailer
                  </Button>
                )}
                <Button asChild variant="outline">
                  <a href={d?.tmdbUrl ?? `https://www.themoviedb.org/movie/${m.id}`} target="_blank" rel="noreferrer">
                    View on TMDB <ExternalLink />
                  </a>
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
