"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { DashboardPreferencesRow, Database } from "@/types/database";

export const WIDGETS = ["welcome", "prayer", "holidays", "currency", "gold", "stocks", "assets", "cve", "news", "quick_access"] as const;
export type WidgetId = (typeof WIDGETS)[number];

export const WIDGET_LABELS: Record<WidgetId, string> = {
  welcome: "Welcome",
  prayer: "Prayer times today",
  holidays: "Next day off",
  currency: "Currency overview",
  gold: "Gold prices",
  stocks: "Indonesian stocks",
  assets: "Asset overview",
  cve: "CVE overview",
  news: "Technology news",
  quick_access: "Quick access",
};

export const prefKey = ["dashboard", "preferences"] as const;

export function normalizeOrder(order: string[]): WidgetId[] {
  const result = [...new Set(order.filter((w): w is WidgetId => (WIDGETS as readonly string[]).includes(w)))];
  // Widgets added after the order was saved go right after their default predecessor.
  WIDGETS.forEach((id, i) => {
    if (result.includes(id)) return;
    const after = i === 0 ? -1 : result.indexOf(WIDGETS[i - 1]!);
    result.splice(after + 1, 0, id);
  });
  return result;
}

export function useDashboardPreferences() {
  return useQuery({
    queryKey: prefKey,
    queryFn: async (): Promise<DashboardPreferencesRow | null> => {
      const { data, error } = await getSupabaseBrowserClient().from("dashboard_preferences").select("*").maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
  });
}

type PrefUpdate = Database["public"]["Tables"]["dashboard_preferences"]["Update"];

export function useUpdateDashboardPreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: PrefUpdate) => {
      const db = getSupabaseBrowserClient();
      // Upsert keeps working even if the bootstrap row is missing.
      const { error } = await db.from("dashboard_preferences").upsert(values, { onConflict: "user_id" });
      if (error) throw new Error(error.message);
    },
    onMutate: async (values) => {
      await qc.cancelQueries({ queryKey: prefKey });
      const prev = qc.getQueryData<DashboardPreferencesRow | null>(prefKey);
      if (prev) qc.setQueryData(prefKey, { ...prev, ...values });
      return { prev };
    },
    onError: (e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(prefKey, ctx.prev);
      toast.error(e.message);
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: prefKey }),
  });
}
