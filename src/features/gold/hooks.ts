"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/http";
import type { ApiResponse } from "@/types/api";
import type { GoldBoard, GoldHistory, GoldRange } from "@/features/gold/types";

export const goldKeys = {
  board: ["gold", "board"] as const,
  history: (type: string, weight: number, range: GoldRange) => ["gold", "history", type, weight, range] as const,
};

export function useGoldBoard() {
  return useQuery({
    queryKey: goldKeys.board,
    queryFn: () => fetchJson<ApiResponse<GoldBoard>>("/api/gold/prices"),
    staleTime: 15 * 60 * 1000,
    refetchInterval: 30 * 60 * 1000,
  });
}

export function useGoldHistory(type: string | null, weight: number | null, range: GoldRange) {
  return useQuery({
    queryKey: goldKeys.history(type ?? "", weight ?? 0, range),
    queryFn: () => {
      const params = new URLSearchParams({ type: type!, weight: String(weight), range });
      return fetchJson<ApiResponse<GoldHistory>>(`/api/gold/history?${params}`);
    },
    enabled: Boolean(type && weight),
    placeholderData: keepPreviousData,
    staleTime: 30 * 60 * 1000,
  });
}
