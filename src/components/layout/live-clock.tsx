"use client";

import { useNow } from "@/hooks/use-now";
import { cn } from "@/lib/utils";

export function LiveClock({ timezone, className }: { timezone: string; className?: string }) {
  const now = useNow(1000);

  if (!now) return <div className={cn("h-8 w-40", className)} aria-hidden />;

  const date = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: timezone,
  }).format(now);
  const time = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: timezone,
  }).format(now);

  return (
    <div className={cn("items-center gap-2 text-xs text-muted-foreground", className)}>
      <span>{date}</span>
      <span className="tabular rounded-md border bg-card px-2 py-1 font-mono text-foreground">{time}</span>
    </div>
  );
}
