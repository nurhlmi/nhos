"use client";

import { addDays, differenceInCalendarDays, format, isWeekend, parseISO } from "date-fns";
import { useHolidays } from "@/features/holidays/hooks";
import type { Holiday } from "@/features/holidays/types";

/** Holidays are national, so "today" is the Jakarta date. */
export const HOLIDAY_TIME_ZONE = "Asia/Jakarta";

/** The stretch of consecutive days off (holidays, cuti bersama and weekends) that contains `date`. */
function offStretch(date: string, offDates: Set<string>) {
  const isOff = (d: Date) => isWeekend(d) || offDates.has(format(d, "yyyy-MM-dd"));
  let start = parseISO(date);
  let end = start;
  while (isOff(addDays(start, -1))) start = addDays(start, -1);
  while (isOff(addDays(end, 1))) end = addDays(end, 1);
  return { start, end, days: differenceInCalendarDays(end, start) + 1 };
}

export function untilLabel(days: number) {
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}

/**
 * Next day off from `today` (YYYY-MM-DD). Looks into next year once this
 * year's dates have all passed.
 */
export function useNextDayOff(today: string | null) {
  const year = today ? Number(today.slice(0, 4)) : null;
  const current = useHolidays(year);
  const list = current.data?.data.holidays;
  const remaining = today ? list?.filter((h) => h.date >= today) : undefined;
  const needsNextYear = remaining !== undefined && remaining.length === 0;
  const following = useHolidays(year === null ? null : year + 1, { enabled: needsNextYear });

  const query = needsNextYear ? following : current;
  const pool = needsNextYear ? following.data?.data.holidays : list;
  const upcoming: Holiday[] | undefined = today ? pool?.filter((h) => h.date >= today) : undefined;
  const next = upcoming?.[0];
  const sameDay = next ? upcoming!.filter((h) => h.date === next.date) : [];
  const later = next ? upcoming!.filter((h) => h.date !== next.date) : [];
  const offDates = new Set([...(list ?? []), ...(following.data?.data.holidays ?? [])].map((h) => h.date));
  const stretch = next ? offStretch(next.date, offDates) : null;
  const daysUntil = next && today ? differenceInCalendarDays(parseISO(next.date), parseISO(today)) : null;
  const leftThisYear = remaining ? new Set(remaining.map((h) => h.date)).size : null;

  return { query, year, loaded: pool !== undefined, next, sameDay, later, stretch, daysUntil, leftThisYear };
}
