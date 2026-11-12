"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchJson } from "@/lib/http";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ApiResponse, Paginated } from "@/types/api";
import type { CveBookmarkRow, CveNoteRow } from "@/types/database";
import type { CveDetail, CveOverview, CveSearchParams, CveSummary, KevEntry } from "@/features/cve/types";

export const cveKeys = {
  search: (p: CveSearchParams) => ["cve", "search", p] as const,
  detail: (id: string) => ["cve", "detail", id] as const,
  overview: ["cve", "overview"] as const,
  kev: (p: object) => ["cve", "kev", p] as const,
  bookmarks: ["cve", "bookmarks"] as const,
  notes: (bookmarkId: string) => ["cve", "notes", bookmarkId] as const,
};

function toQuery(p: object) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) if (v !== undefined && v !== "" && v !== null) params.set(k, String(v));
  return params.toString();
}

export function useCveSearch(p: CveSearchParams) {
  return useQuery({
    queryKey: cveKeys.search(p),
    queryFn: () => fetchJson<ApiResponse<Paginated<CveSummary>>>(`/api/cve/search?${toQuery(p)}`),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCveDetail(id: string) {
  return useQuery({
    queryKey: cveKeys.detail(id),
    queryFn: () => fetchJson<ApiResponse<CveDetail>>(`/api/cve/detail/${encodeURIComponent(id)}`),
    staleTime: 30 * 60 * 1000,
  });
}

export function useCveOverview() {
  return useQuery({
    queryKey: cveKeys.overview,
    queryFn: () => fetchJson<ApiResponse<CveOverview>>("/api/cve/overview"),
    staleTime: 10 * 60 * 1000,
  });
}

type KevPage = Paginated<KevEntry> & { catalogTotal: number };
export function useKev(p: { page: number; pageSize?: number; q?: string; ransomware?: string }) {
  return useQuery({
    queryKey: cveKeys.kev(p),
    queryFn: () => fetchJson<ApiResponse<KevPage>>(`/api/cve/kev?${toQuery(p)}`),
    placeholderData: keepPreviousData,
    staleTime: 30 * 60 * 1000,
  });
}

// Watchlist (bookmarks + notes) – Supabase with RLS

const db = () => getSupabaseBrowserClient();

export function useCveBookmarks() {
  return useQuery({
    queryKey: cveKeys.bookmarks,
    queryFn: async (): Promise<CveBookmarkRow[]> => {
      const { data, error } = await db().from("cve_bookmarks").select("*").order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data;
    },
  });
}

export function useToggleBookmark() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ cve, bookmark }: { cve: CveSummary; bookmark?: CveBookmarkRow }) => {
      if (bookmark) {
        const { error } = await db().from("cve_bookmarks").delete().eq("id", bookmark.id);
        if (error) throw new Error(error.message);
        return "removed" as const;
      }
      const { error } = await db().from("cve_bookmarks").insert({
        cve_id: cve.id,
        description: cve.description.slice(0, 2000),
        severity: cve.severity,
        cvss_score: cve.cvssScore,
        published_at: cve.published,
      });
      if (error && error.code !== "23505") throw new Error(error.message);
      return "added" as const;
    },
    onSuccess: (result, { cve }) => {
      toast.success(result === "added" ? `${cve.id} added to watchlist` : `${cve.id} removed from watchlist`);
      void qc.invalidateQueries({ queryKey: cveKeys.bookmarks });
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useSetReviewed() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ bookmark, reviewed }: { bookmark: CveBookmarkRow; reviewed: boolean }) => {
      const { error } = await db()
        .from("cve_bookmarks")
        .update({ is_reviewed: reviewed, reviewed_at: reviewed ? new Date().toISOString() : null })
        .eq("id", bookmark.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_d, { bookmark, reviewed }) => {
      toast.success(`${bookmark.cve_id} marked as ${reviewed ? "reviewed" : "not reviewed"}`);
      void qc.invalidateQueries({ queryKey: cveKeys.bookmarks });
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useCveNotes(bookmarkId: string | undefined) {
  return useQuery({
    queryKey: cveKeys.notes(bookmarkId ?? ""),
    enabled: Boolean(bookmarkId),
    queryFn: async (): Promise<CveNoteRow[]> => {
      const { data, error } = await db()
        .from("cve_notes")
        .select("*")
        .eq("bookmark_id", bookmarkId!)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data;
    },
  });
}

export function useNoteMutations(bookmarkId: string | undefined) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: cveKeys.notes(bookmarkId ?? "") });
  const add = useMutation({
    mutationFn: async (content: string) => {
      if (!bookmarkId) throw new Error("Add the CVE to your watchlist first");
      const { error } = await db().from("cve_notes").insert({ bookmark_id: bookmarkId, content });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Note saved");
      void invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const update = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const { error } = await db().from("cve_notes").update({ content }).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Note updated");
      void invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db().from("cve_notes").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Note deleted");
      void invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  return { add, update, remove };
}
