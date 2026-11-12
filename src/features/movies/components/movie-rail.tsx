"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Clapperboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { formatDate } from "@/utils/format";
import { cn } from "@/lib/utils";
import { MovieImage } from "@/features/movies/components/movie-poster";
import { movieMeta } from "@/features/movies/format";
import type { MovieSummary } from "@/features/movies/types";

const CARD_WIDTH = "w-32 sm:w-36 lg:w-40";

/** Horizontally scrolling row of posters. Arrow buttons page by the visible width; touch users swipe. */
export function MovieRail({
  id,
  title,
  description,
  movies,
  isLoading,
  error,
  onRetry,
  emptyText,
  emptyAction,
  showDateChip = false,
  onSelect,
}: {
  id: string;
  title: string;
  description: string;
  movies: MovieSummary[] | undefined;
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
  emptyText: string;
  /** Shown in the empty state, e.g. to clear a filter that emptied the list. */
  emptyAction?: React.ReactNode;
  /** Upcoming films lead with their Indonesian release date on the poster. */
  showDateChip?: boolean;
  onSelect: (movie: MovieSummary) => void;
}) {
  const scroller = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: true });

  const measure = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  }, []);

  useEffect(() => {
    const el = scroller.current;
    // A new set of films (e.g. another genre) starts from the first poster.
    if (el) el.scrollLeft = 0;
    measure();
    if (!el) return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure, movies]);

  const page = (dir: 1 | -1) => {
    const el = scroller.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  const headingId = `${id}-heading`;

  return (
    <section aria-labelledby={headingId} className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 id={headingId} className="text-base font-semibold tracking-tight sm:text-lg">
            {title}
            {movies && movies.length > 0 && <span className="ml-2 text-sm font-normal text-muted-foreground">{movies.length} films</span>}
          </h2>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        {movies && movies.length > 0 && (
          <div className="hidden shrink-0 gap-1 pointer-fine:flex">
            <Button variant="outline" size="icon" aria-label={`Scroll ${title} left`} disabled={edges.start} onClick={() => page(-1)}>
              <ChevronLeft />
            </Button>
            <Button variant="outline" size="icon" aria-label={`Scroll ${title} right`} disabled={edges.end} onClick={() => page(1)}>
              <ChevronRight />
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex gap-3 overflow-hidden" aria-busy="true" aria-label={`Loading ${title}`}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={cn("shrink-0 space-y-2", CARD_WIDTH)}>
              <Skeleton className="aspect-[2/3] w-full rounded-md" />
              <Skeleton className="h-3.5 w-4/5" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : error ? (
        <ErrorState title={`Could not load ${title.toLowerCase()}`} error={error} onRetry={onRetry} />
      ) : !movies?.length ? (
        <EmptyState icon={Clapperboard} title="No films in this list" description={emptyText} action={emptyAction} />
      ) : (
        <ul
          ref={scroller}
          onScroll={measure}
          className="-mx-1 flex snap-x snap-mandatory scroll-px-1 gap-3 overflow-x-auto px-1 pt-1 pb-3 [scrollbar-width:thin]"
        >
          {movies.map((m) => {
            const meta = movieMeta(m, { withDate: !showDateChip });
            return (
              <li key={m.id} className={cn("shrink-0 snap-start", CARD_WIDTH)}>
                <button
                  type="button"
                  onClick={() => onSelect(m)}
                  className="group block w-full rounded-md text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/60"
                >
                  <div className="relative overflow-hidden rounded-md ring-1 ring-border transition-shadow group-hover:ring-2 group-hover:ring-primary/70">
                    <MovieImage src={m.posterUrl} className="aspect-[2/3] w-full transition-transform duration-200 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100" />
                    {showDateChip && m.releaseDate && (
                      <span className="absolute top-1.5 left-1.5 rounded-sm bg-black/80 px-1.5 py-0.5 text-[11px] font-medium text-white">
                        {formatDate(m.releaseDate, "d MMM")}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm leading-snug font-medium">{m.title}</p>
                  {meta.length > 0 && <p className="mt-0.5 truncate text-xs text-muted-foreground">{meta.join(" · ")}</p>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
