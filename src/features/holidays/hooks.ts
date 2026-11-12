"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/http";
import type { ApiResponse } from "@/types/api";
import type { HolidayYear } from "@/features/holidays/types";

export const holidayKeys = {
  year: (year: number) => ["holidays", year] as const,
};

export function useHolidays(year: number | null, { enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: holidayKeys.year(year ?? 0),
    queryFn: () => fetchJson<ApiResponse<HolidayYear>>(`/api/holidays?${new URLSearchParams({ year: String(year) })}`),
    enabled: enabled && year !== null,
    placeholderData: keepPreviousData,
    staleTime: 12 * 60 * 60 * 1000,
  });
}
