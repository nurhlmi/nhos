"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/http";
import type { ApiResponse } from "@/types/api";
import type { StockHistory, StockQuote, StockRange } from "@/features/stocks/types";

export const stockKeys = {
  index: ["stocks", "index"] as const,
  quotes: (codes: string[]) => ["stocks", "quotes", codes.join(",")] as const,
  history: (code: string, range: StockRange) => ["stocks", "history", code, range] as const,
};

export function useIndexSnapshot() {
  return useQuery({
    queryKey: stockKeys.index,
    queryFn: () => fetchJson<ApiResponse<StockQuote>>("/api/stocks/index"),
    staleTime: 4 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}

export function useStockQuotes(codes: string[]) {
  return useQuery({
    queryKey: stockKeys.quotes(codes),
    queryFn: () => fetchJson<ApiResponse<StockQuote[]>>(`/api/stocks/quotes?${new URLSearchParams({ codes: codes.join(",") })}`),
    enabled: codes.length > 0,
    staleTime: 4 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}

export function useStockHistory(code: string, range: StockRange) {
  return useQuery({
    queryKey: stockKeys.history(code, range),
    queryFn: () => fetchJson<ApiResponse<StockHistory>>(`/api/stocks/history?${new URLSearchParams({ code, range })}`),
    placeholderData: keepPreviousData,
    staleTime: 30 * 60 * 1000,
  });
}
