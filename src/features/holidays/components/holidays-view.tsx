"use client";

import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WidgetCard } from "@/components/shared/widget-card";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/shared/states";
import { SourceBadge } from "@/components/shared/source-badge";
import { useNow } from "@/hooks/use-now";
import { cn } from "@/lib/utils";
import { zonedNow } from "@/features/prayer/time";
import { useHolidays } from "@/features/holidays/hooks";
import type { Holiday, HolidayType } from "@/features/holidays/types";
import { HOLIDAY_TIME_ZONE, untilLabel, useNextDayOff } from "@/features/holidays/next-day-off";
import { HolidayTypeBadge } from "@/features/holidays/components/type-badge";

type Filter = "all" | HolidayType;

function NextDayOff({ today }: { today: string }) {
  const { query, year, loaded, next, sameDay, stretch, daysUntil, leftThisYear } = useNextDayOff(today);

  return (
    <WidgetCard title="Next day off" footer={<SourceBadge meta={query.data?.meta} />}>
      {query.isError ? (
        <ErrorState title="Holidays unavailable" error={query.error} onRetry={() => void query.refetch()} compact />
      ) : !loaded ? (
        <div className="space-y-2" aria-busy="true" aria-label="Loading">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      ) : !next ? (
        <EmptyState
          compact
          title={`No dates published after ${format(parseISO(today), "d MMM yyyy")}`}
          description={`Tanggal Merah has not published ${year! + 1} yet. It usually appears once the SKB 3 Menteri is signed.`}
        />
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 space-y-1">
            <p className="text-2xl font-semibold tracking-tight">
              {format(parseISO(next.date), "EEEE, d MMMM")}
              <span className="ml-2 text-base font-medium text-primary">{untilLabel(daysUntil!)}</span>
            </p>
            {sameDay.map((h) => (
              <p key={h.name} className="flex flex-wrap items-center gap-2 text-sm">
                <span>{h.name}</span>
                <HolidayTypeBadge type={h.type} />
              </p>
            ))}
          </div>
          <div className="shrink-0 space-y-0.5 text-sm text-muted-foreground sm:text-right">
            {stretch && stretch.days > 1 && (
              <p>
                <span className="font-medium text-foreground">{stretch.days} days off in a row</span>, {format(stretch.start, "EEE d MMM")} to {format(stretch.end, "EEE d MMM")}
              </p>
            )}
            {leftThisYear !== null && (
              <p>
                {leftThisYear === 0 ? `No days off left in ${year}` : `${leftThisYear} ${leftThisYear === 1 ? "date" : "dates"} left in ${year}`}
              </p>
            )}
          </div>
        </div>
      )}
    </WidgetCard>
  );
}

function YearTable({ initialYear, today }: { initialYear: number; today: string }) {
  const [year, setYear] = useState(initialYear);
  const [filter, setFilter] = useState<Filter>("all");
  const query = useHolidays(year);
  const data = query.data?.data;
  const years = data?.years ?? [];
  const canGo = (n: number) => years.includes(year + n);

  const counts = useMemo(() => {
    const list = data?.holidays ?? [];
    return { all: list.length, holiday: list.filter((h) => h.type === "holiday").length, leave: list.filter((h) => h.type === "leave").length };
  }, [data]);

  const months = useMemo(() => {
    const groups = new Map<string, Holiday[]>();
    for (const h of data?.holidays ?? []) {
      if (filter !== "all" && h.type !== filter) continue;
      const key = h.date.slice(0, 7);
      groups.set(key, [...(groups.get(key) ?? []), h]);
    }
    return [...groups.entries()];
  }, [data, filter]);

  const nextDate = data?.holidays.find((h) => h.date >= today)?.date;
  const shownYear = data?.year ?? year;

  return (
    <WidgetCard
      title={`${shownYear} holidays and cuti bersama`}
      bodyClassName="p-0"
      actions={
        <>
          <Button variant="ghost" size="icon-sm" aria-label={`Show ${year - 1}`} disabled={!canGo(-1)} onClick={() => setYear(year - 1)}>
            <ChevronLeft />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label={`Show ${year + 1}`} disabled={!canGo(1)} onClick={() => setYear(year + 1)}>
            <ChevronRight />
          </Button>
        </>
      }
      footer={<SourceBadge meta={query.data?.meta} />}
    >
      {query.isError && !data ? (
        <ErrorState title={`${year} holidays unavailable`} error={query.error} onRetry={() => void query.refetch()} className="m-4" />
      ) : !data ? (
        <ListSkeleton rows={8} className="p-4" />
      ) : (
        <>
          <div className="border-b px-4 py-2.5">
            <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
              <TabsList>
                <TabsTrigger value="all">All {counts.all}</TabsTrigger>
                <TabsTrigger value="holiday">Public holidays {counts.holiday}</TabsTrigger>
                <TabsTrigger value="leave">Cuti bersama {counts.leave}</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          {months.length === 0 ? (
            <EmptyState
              title={counts.all === 0 ? `Nothing published for ${shownYear}` : "No dates of this type"}
              description={counts.all === 0 ? "Tanggal Merah lists no dates for this year yet. Try the current year." : "Switch the filter to All to see every date."}
              className="m-4"
            />
          ) : (
            <div className={cn(query.isPlaceholderData && "opacity-60")}>
              <Table className="text-sm [&_td:first-child]:pl-4 [&_td:last-child]:pr-4 [&_th:first-child]:pl-4 [&_th:last-child]:pr-4">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-28">Date</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden w-36 sm:table-cell">Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {months.map(([month, items]) => (
                    <MonthRows key={month} month={month} items={items} today={today} nextDate={nextDate} />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}
    </WidgetCard>
  );
}

function MonthRows({ month, items, today, nextDate }: { month: string; items: Holiday[]; today: string; nextDate?: string }) {
  return (
    <>
      <TableRow className="hover:bg-transparent">
        <TableCell colSpan={3} className="bg-muted/40 py-1.5 text-xs font-medium text-muted-foreground">
          {format(parseISO(`${month}-01`), "MMMM")}
        </TableCell>
      </TableRow>
      {items.map((h) => {
        const past = h.date < today;
        const isNext = h.date === nextDate;
        return (
          <TableRow
            key={`${h.date}-${h.name}`}
            aria-current={isNext ? "date" : undefined}
            className={cn(isNext && "bg-primary/10 hover:bg-primary/10")}
          >
            <TableCell className={cn("whitespace-nowrap tabular-nums", isNext ? "font-semibold text-primary" : past && "text-muted-foreground")}>
              {format(parseISO(h.date), "EEE d MMM")}
            </TableCell>
            <TableCell className={cn("whitespace-normal", past && !isNext && "text-muted-foreground")}>
              <span>{h.name}</span>
              <span className="mt-1 block sm:hidden">
                <HolidayTypeBadge type={h.type} />
              </span>
            </TableCell>
            <TableCell className="hidden sm:table-cell">
              <HolidayTypeBadge type={h.type} />
            </TableCell>
          </TableRow>
        );
      })}
    </>
  );
}

export function HolidaysView() {
  const now = useNow(60 * 60 * 1000);
  const today = now ? zonedNow(now, HOLIDAY_TIME_ZONE).date : null;

  if (!today) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-36 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <NextDayOff today={today} />
      <YearTable initialYear={Number(today.slice(0, 4))} today={today} />
    </div>
  );
}
