"use client";

import { cn } from "@/lib/utils";

export const ALL_GENRES = "all";

/**
 * Single-choice genre chips. Only genres that appear in the loaded lists are
 * offered, most common first, so no chip leads to an empty page.
 */
export function GenreFilter({
  genres,
  value,
  onChange,
}: {
  genres: { name: string; count: number }[];
  value: string;
  onChange: (genre: string) => void;
}) {
  const options = [{ name: ALL_GENRES, count: 0 }, ...genres];
  return (
    <div role="group" aria-label="Filter by genre" className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
      {options.map((g) => {
        const active = value === g.name;
        return (
          <button
            key={g.name}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(g.name)}
            className={cn(
              "h-8 shrink-0 rounded-md border px-3 text-xs whitespace-nowrap transition-colors outline-none pointer-coarse:h-11 focus-visible:ring-3 focus-visible:ring-ring/50",
              active ? "border-primary/40 bg-primary/10 font-medium text-primary" : "bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {g.name === ALL_GENRES ? "All genres" : g.name}
            {g.name !== ALL_GENRES && <span className="ml-1.5 tabular-nums opacity-70">{g.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
