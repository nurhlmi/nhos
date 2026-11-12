"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import { Moon, Sun, SunDim, Sunrise, Sunset, type LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { WidgetCard } from "@/components/shared/widget-card";
import { ErrorState } from "@/components/shared/states";
import { SourceBadge } from "@/components/shared/source-badge";
import { useNow } from "@/hooks/use-now";
import { cn } from "@/lib/utils";
import type { ApiResponse } from "@/types/api";
import { PRAYER_TIMES } from "@/features/prayer/constants";
import { formatCountdown, nextPrayer, toMinutes, zonedNow } from "@/features/prayer/time";
import type { PrayerTimeKey, PrayerToday } from "@/features/prayer/types";

/** Where the sun is at each prayer: dawn, noon, afternoon, sunset, night. */
const PRAYER_ICONS: Partial<Record<PrayerTimeKey, LucideIcon>> = {
  subuh: Sunrise,
  dzuhur: Sun,
  ashar: SunDim,
  maghrib: Sunset,
  isya: Moon,
};

const DAILY = PRAYER_TIMES.filter((p) => p.obligatory);
const EXTRA = PRAYER_TIMES.filter((p) => !p.obligatory);

function TodayPrayers({ data }: { data: PrayerToday }) {
  const now = useNow(1000);
  const { location, today, tomorrow } = data;
  const next = now ? nextPrayer(today, tomorrow, now, location.timeZone) : null;
  const local = now ? zonedNow(now, location.timeZone) : null;
  const isToday = local?.date === today.date;

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="flex items-end justify-between gap-4 lg:w-56 lg:shrink-0 lg:flex-col lg:items-start lg:gap-1 lg:border-r lg:pr-4">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Next prayer{next?.tomorrow ? ", tomorrow" : ""}</p>
            {next ? (
              <p className="mt-0.5 flex items-baseline gap-2">
                <span className="text-lg font-semibold tracking-tight">{next.label}</span>
                <span className="font-mono text-xs text-muted-foreground tabular-nums">
                  {next.time} {location.zoneLabel}
                </span>
              </p>
            ) : (
              <Skeleton className="mt-1 h-6 w-28" />
            )}
          </div>
          {next ? (
            <p className="font-mono text-lg font-semibold text-primary tabular-nums">
              <span className="sr-only">Starts in </span>
              {formatCountdown(next.secondsLeft)}
            </p>
          ) : (
            <Skeleton className="h-6 w-24" />
          )}
        </div>
        <ol className="grid flex-1 grid-cols-5 gap-2">
          {DAILY.map((p) => {
            const Icon = PRAYER_ICONS[p.key];
            const isNext = next !== null && !next.tomorrow && next.key === p.key;
            const passed = isToday && local !== null && toMinutes(today[p.key]) <= local.minutes;
            return (
              <li
                key={p.key}
                aria-current={isNext ? "time" : undefined}
                className={cn("rounded-lg border px-1 py-2 text-center", isNext && "border-primary/40 bg-primary/10")}
              >
                {Icon && <Icon aria-hidden="true" className={cn("mx-auto mb-1 size-4", isNext ? "text-primary" : "text-muted-foreground")} />}
                <p className={cn("truncate text-[11px] sm:text-xs", isNext ? "font-medium text-primary" : "text-muted-foreground")}>{p.label}</p>
                <p className={cn("mt-0.5 font-mono text-sm font-medium tabular-nums", isNext && "text-primary", passed && "text-muted-foreground")}>
                  {today[p.key]}
                </p>
              </li>
            );
          })}
        </ol>
      </div>
      {/* Not one of the five prayers, but Imsak matters in Ramadan and Terbit ends Subuh. */}
      <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground lg:pl-60">
        {EXTRA.map((p) => (
          <span key={p.key} className="whitespace-nowrap">
            {p.label} <span className="font-mono tabular-nums">{today[p.key]}</span>
          </span>
        ))}
      </p>
    </div>
  );
}

function TodayPrayersSkeleton() {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-12 lg:w-56" />
      <div className="grid flex-1 grid-cols-5 gap-2">
        {DAILY.map((p) => (
          <Skeleton key={p.key} className="h-[4.75rem]" />
        ))}
      </div>
    </div>
  );
}

/** Today's card, shared by the Prayer Times page and the overview so both read the same. */
export function TodayPrayersCard({
  query,
  title,
  icon,
  href,
  className,
}: {
  query: UseQueryResult<ApiResponse<PrayerToday>>;
  title: (data: PrayerToday | undefined) => string;
  icon?: LucideIcon;
  href?: string;
  className?: string;
}) {
  const data = query.data?.data;
  return (
    <WidgetCard title={title(data)} icon={icon} href={href} className={className} footer={<SourceBadge meta={query.data?.meta} />}>
      {query.isError ? (
        <ErrorState title="Prayer times unavailable" error={query.error} onRetry={() => void query.refetch()} compact />
      ) : !data ? (
        <TodayPrayersSkeleton />
      ) : (
        <TodayPrayers data={data} />
      )}
    </WidgetCard>
  );
}
