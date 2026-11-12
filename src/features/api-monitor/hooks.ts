"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/http";
import type { ApiMonitorReport } from "@/features/api-monitor/types";

const key = ["api-monitor"] as const;

export function useApiMonitor() {
  return useQuery({
    queryKey: key,
    queryFn: () => fetchJson<ApiMonitorReport>("/api/monitoring"),
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
  });
}

/** Re-runs every check on the server instead of reading the 1-minute cache. */
export function useRecheckApis() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => fetchJson<ApiMonitorReport>("/api/monitoring?refresh=1"),
    onSuccess: (report) => client.setQueryData(key, report),
  });
}
