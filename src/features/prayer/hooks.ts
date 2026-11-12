"use client";

import { useCallback, useEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/http";
import type { ApiResponse } from "@/types/api";
import { CITY_STORAGE_KEY, DEFAULT_CITY_ID } from "@/features/prayer/constants";
import type { PrayerCity, PrayerMonth, PrayerToday } from "@/features/prayer/types";

export const prayerKeys = {
  cities: ["prayer", "cities"] as const,
  today: (city: string) => ["prayer", "today", city] as const,
  month: (city: string, month: string) => ["prayer", "month", city, month] as const,
};

export function usePrayerCities() {
  return useQuery({
    queryKey: prayerKeys.cities,
    queryFn: () => fetchJson<ApiResponse<PrayerCity[]>>("/api/prayer/cities"),
    staleTime: 24 * 60 * 60 * 1000,
  });
}

export function usePrayerToday(city: string | null) {
  return useQuery({
    queryKey: prayerKeys.today(city ?? ""),
    queryFn: () => fetchJson<ApiResponse<PrayerToday>>(`/api/prayer/today?${new URLSearchParams({ city: city! })}`),
    enabled: Boolean(city),
    staleTime: 30 * 60 * 1000,
    // Picks up the new day's schedule on a page left open overnight.
    refetchInterval: 30 * 60 * 1000,
  });
}

export function usePrayerMonth(city: string | null, month: string | null) {
  return useQuery({
    queryKey: prayerKeys.month(city ?? "", month ?? ""),
    queryFn: () => fetchJson<ApiResponse<PrayerMonth>>(`/api/prayer/month?${new URLSearchParams({ city: city!, month: month! })}`),
    enabled: Boolean(city && month),
    placeholderData: keepPreviousData,
    staleTime: 12 * 60 * 60 * 1000,
  });
}

/** Selected city, remembered in this browser. Null until mounted so server and client markup match. */
export function usePrayerCity(): [string | null, (id: string) => void] {
  const [city, setCity] = useState<string | null>(null);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(CITY_STORAGE_KEY);
    } catch {
      // storage blocked: fall back to the default city
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read the remembered city on mount
    setCity(stored && /^[a-f0-9]{32}$/.test(stored) ? stored : DEFAULT_CITY_ID);
  }, []);

  const choose = useCallback((id: string) => {
    setCity(id);
    try {
      localStorage.setItem(CITY_STORAGE_KEY, id);
    } catch {
      // storage blocked: the choice lasts for this visit only
    }
  }, []);

  return [city, choose];
}
