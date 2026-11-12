"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchJson } from "@/lib/http";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ApiResponse } from "@/types/api";
import type { NewsBookmarkRow } from "@/types/database";
import type { FeedStatus, NewsArticle } from "@/features/news/feeds";

export const newsKeys = {
  feed: ["news", "feed"] as const,
  bookmarks: ["news", "bookmarks"] as const,
};

export function useNews() {
  return useQuery({
    queryKey: newsKeys.feed,
    queryFn: () => fetchJson<ApiResponse<{ articles: NewsArticle[]; feeds: FeedStatus[] }>>("/api/news"),
    staleTime: 10 * 60 * 1000,
    refetchInterval: 20 * 60 * 1000,
  });
}

const db = () => getSupabaseBrowserClient();

export function useNewsBookmarks() {
  return useQuery({
    queryKey: newsKeys.bookmarks,
    queryFn: async (): Promise<NewsBookmarkRow[]> => {
      const { data, error } = await db().from("news_bookmarks").select("*").order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data;
    },
  });
}

export function useSaveArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (a: NewsArticle) => {
      const { error } = await db().from("news_bookmarks").insert({
        article_url: a.url,
        title: a.title,
        description: a.description || null,
        source: a.source,
        category: a.category,
        image_url: a.imageUrl,
        published_at: a.publishedAt,
      });
      if (error && error.code !== "23505") throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Saved to read later");
      void qc.invalidateQueries({ queryKey: newsKeys.bookmarks });
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useRemoveBookmark() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db().from("news_bookmarks").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Bookmark removed");
      void qc.invalidateQueries({ queryKey: newsKeys.bookmarks });
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useSetRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, read }: { id: string; read: boolean }) => {
      const { error } = await db()
        .from("news_bookmarks")
        .update({ is_read: read, read_at: read ? new Date().toISOString() : null })
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    onMutate: async ({ id, read }) => {
      await qc.cancelQueries({ queryKey: newsKeys.bookmarks });
      const prev = qc.getQueryData<NewsBookmarkRow[]>(newsKeys.bookmarks);
      qc.setQueryData<NewsBookmarkRow[]>(newsKeys.bookmarks, (rows) => rows?.map((r) => (r.id === id ? { ...r, is_read: read } : r)));
      return { prev };
    },
    onError: (e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(newsKeys.bookmarks, ctx.prev);
      toast.error(e.message);
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: newsKeys.bookmarks }),
  });
}
