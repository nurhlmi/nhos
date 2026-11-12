"use client";

import { useState } from "react";
import { addMonths, format, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { WidgetCard } from "@/components/shared/widget-card";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/shared/states";
import { SourceBadge } from "@/components/shared/source-badge";
import { useNow } from "@/hooks/use-now";
import { cn } from "@/lib/utils";
import { PRAYER_TIMES } from "@/features/prayer/constants";
import { usePrayerCity, usePrayerMonth, usePrayerToday } from "@/features/prayer/hooks";
import { zonedNow } from "@/features/prayer/time";
import { CityPicker } from "@/features/prayer/components/city-picker";
import { TodayPrayersCard } from "@/features/prayer/components/today-prayers";
import { titleCase } from "@/features/prayer/format";

function LocalClock({ timeZone, zoneLabel }: { timeZone: string; zoneLabel: string }) {
  const now = useNow(10_000);
  if (!now) return null;
  const time = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(now);
  return (
    <span className="whitespace-nowrap">
      now <span className="font-mono tabular-nums">{time}</span> {zoneLabel}
    </span>
  );
}

function MonthTable({ city, timeZone }: { city: string; timeZone: string }) {
  const [month, setMonth] = useState<string | null>(null);
  const current = month ?? zonedNow(new Date(), timeZone).date.slice(0, 7);
  const today = zonedNow(new Date(), timeZone).date;
  const query = usePrayerMonth(city, current);
  const shift = (n: number) => setMonth(format(addMonths(parseISO(`${current}-01`), n), "yyyy-MM"));
  const days = query.data?.data.days;

  return (
    <WidgetCard
      title={`${format(parseISO(`${current}-01`), "MMMM yyyy")} schedule`}
      bodyClassName="p-0"
      actions={
        <>
          <Button variant="ghost" size="icon-sm" aria-label="Previous month" onClick={() => shift(-1)}>
            <ChevronLeft />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Next month" onClick={() => shift(1)}>
            <ChevronRight />
          </Button>
        </>
      }
      footer={<SourceBadge meta={query.data?.meta} />}
    >
      {query.isError ? (
        <ErrorState title="Monthly schedule unavailable" error={query.error} onRetry={() => void query.refetch()} className="m-4" />
      ) : !days ? (
        <ListSkeleton rows={10} className="p-4" />
      ) : days.length === 0 ? (
        <EmptyState title="No schedule for this month" description="myQuran has not published times for this month yet. Try a nearer month." className="m-4" />
      ) : (
        <div className={cn(query.isPlaceholderData && "opacity-60")}>
          {/* Phones get the five daily prayers only (Imsak, Terbit and Dhuha stay in the Today card), so nine columns never scroll sideways. */}
          <Table className="font-mono text-xs tabular-nums [&_td]:px-1.5 [&_td:first-child]:pl-4 [&_td:last-child]:pr-4 [&_th]:px-1.5 [&_th:first-child]:pl-4 [&_th:last-child]:pr-4 sm:[&_td]:px-2 sm:[&_th]:px-2">
            <TableHeader>
              <TableRow>
                <TableHead className="font-sans">Date</TableHead>
                {PRAYER_TIMES.map((p) => (
                  <TableHead key={p.key} className={cn("text-right font-sans", !p.obligatory && "hidden text-muted-foreground sm:table-cell")}>
                    {p.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {days.map((d) => {
                const isToday = d.date === today;
                return (
                  <TableRow key={d.date} aria-current={isToday ? "date" : undefined} className={cn(isToday && "bg-primary/10 hover:bg-primary/10")}>
                    <TableCell className={cn("font-sans", isToday ? "font-semibold text-primary" : "text-muted-foreground")}>
                      {format(parseISO(d.date), "EEE d")}
                    </TableCell>
                    {PRAYER_TIMES.map((p) => (
                      <TableCell
                        key={p.key}
                        className={cn("text-right", !p.obligatory && "hidden text-muted-foreground sm:table-cell", isToday && p.obligatory && "font-semibold")}
                      >
                        {d[p.key]}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </WidgetCard>
  );
}

export function PrayerView() {
  const [city, setCity] = usePrayerCity();
  const today = usePrayerToday(city);
  const data = today.data?.data;
  const location = data?.location;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="min-h-5 text-sm text-muted-foreground">
          {location ? (
            <>
              {titleCase(location.province)} · <LocalClock timeZone={location.timeZone} zoneLabel={location.zoneLabel} />
            </>
          ) : null}
        </p>
        <CityPicker value={city} label={location ? titleCase(location.city) : null} onChange={setCity} />
      </div>

      <div className="space-y-4">
        <TodayPrayersCard
          query={today}
          title={(d) => (d ? `Today, ${format(parseISO(d.today.date), "EEEE d MMMM")}` : "Today")}
        />

        {city && location ? (
          <MonthTable key={city} city={city} timeZone={location.timeZone} />
        ) : (
          <WidgetCard title="Monthly schedule">
            {today.isError ? (
              <ErrorState title="Monthly schedule unavailable" error={today.error} onRetry={() => void today.refetch()} compact />
            ) : (
              <ListSkeleton rows={10} />
            )}
          </WidgetCard>
        )}
      </div>
    </div>
  );
}
