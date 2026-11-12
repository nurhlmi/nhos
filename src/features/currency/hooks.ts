"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchJson } from "@/lib/http";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ApiResponse } from "@/types/api";
import type { CurrencyWatchlistRow } from "@/types/database";
import type {
  Conversion,
  CurrencyList,
  CurrencyPair,
  HistoryRange,
  PairHistory,
  PairQuote,
} from "@/features/currency/types";

export const currencyKeys = {
  currencies: ["currency", "currencies"] as const,
  quotes: (pairs: string) => ["currency", "quotes", pairs] as const,
  history: (base: string, quote: string, range: HistoryRange) => ["currency", "history", base, quote, range] as const,
  convert: (from: string, to: string, amount: number) => ["currency", "convert", from, to, amount] as const,
  watchlist: ["currency", "watchlist"] as const,
};

const pairsKey = (pairs: CurrencyPair[]) => pairs.map((p) => `${p.base}-${p.quote}`).join(",");

export function useCurrencies() {
  return useQuery({
    queryKey: currencyKeys.currencies,
    queryFn: () => fetchJson<ApiResponse<CurrencyList>>("/api/currency/currencies"),
    staleTime: 24 * 60 * 60 * 1000,
  });
}

export function usePairQuotes(pairs: CurrencyPair[]) {
  const key = pairsKey(pairs);
  return useQuery({
    queryKey: currencyKeys.quotes(key),
    queryFn: () => fetchJson<ApiResponse<PairQuote[]>>(`/api/currency/quotes?pairs=${key}`),
    enabled: pairs.length > 0,
    staleTime: 10 * 60 * 1000,
    refetchInterval: 15 * 60 * 1000,
  });
}

export function usePairHistory(base: string, quote: string, range: HistoryRange, enabled = true) {
  return useQuery({
    enabled,
    queryKey: currencyKeys.history(base, quote, range),
    queryFn: () =>
      fetchJson<ApiResponse<PairHistory>>(`/api/currency/history?base=${base}&quote=${quote}&range=${range}`),
    placeholderData: keepPreviousData,
    staleTime: 30 * 60 * 1000,
  });
}

export function useConversion(from: string, to: string, amount: number, enabled: boolean) {
  return useQuery({
    queryKey: currencyKeys.convert(from, to, amount),
    queryFn: () => fetchJson<ApiResponse<Conversion>>(`/api/currency/convert?from=${from}&to=${to}&amount=${amount}`),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 10 * 60 * 1000,
  });
}

// Watchlist (Supabase, protected by RLS)

export function useWatchlist() {
  return useQuery({
    queryKey: currencyKeys.watchlist,
    queryFn: async (): Promise<CurrencyWatchlistRow[]> => {
      const { data, error } = await getSupabaseBrowserClient()
        .from("currency_watchlists")
        .select("*")
        .order("position", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw new Error(error.message);
      return data;
    },
  });
}

export function useAddWatchPair() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ base, quote, position }: CurrencyPair & { position: number }) => {
      const { error } = await getSupabaseBrowserClient()
        .from("currency_watchlists")
        .insert({ base_currency: base, quote_currency: quote, position });
      if (error) {
        if (error.code === "23505") throw new Error(`${base}/${quote} is already in your watchlist`);
        throw new Error(error.message);
      }
    },
    onSuccess: (_d, v) => {
      toast.success(`${v.base}/${v.quote} added to watchlist`);
      void qc.invalidateQueries({ queryKey: currencyKeys.watchlist });
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useRemoveWatchPair() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: CurrencyWatchlistRow) => {
      const { error } = await getSupabaseBrowserClient().from("currency_watchlists").delete().eq("id", row.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_d, row) => {
      toast.success(`${row.base_currency}/${row.quote_currency} removed`);
      void qc.invalidateQueries({ queryKey: currencyKeys.watchlist });
    },
    onError: (e) => toast.error(e.message),
  });
}
