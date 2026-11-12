"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BookmarkX, CheckCheck, ExternalLink, MailOpen, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/shared/states";
import { formatDate } from "@/utils/format";
import { safeHttpUrl } from "@/utils/validators";
import { cn } from "@/lib/utils";
import type { NewsBookmarkRow } from "@/types/database";
import { useNewsBookmarks, useRemoveBookmark, useSetRead } from "@/features/news/hooks";
import { NewsThumb } from "@/features/news/components/news-thumb";
import { NewsPreviewSheet } from "@/features/news/components/news-preview-sheet";

type View = "unread" | "read" | "all";

export function SavedArticles() {
  const bookmarks = useNewsBookmarks();
  const setRead = useSetRead();
  const remove = useRemoveBookmark();
  const [view, setView] = useState<View>("unread");
  const [preview, setPreview] = useState<NewsBookmarkRow | null>(null);

  const rows = useMemo(
    () => (bookmarks.data ?? []).filter((b) => (view === "all" ? true : view === "read" ? b.is_read : !b.is_read)),
    [bookmarks.data, view],
  );
  const unread = bookmarks.data?.filter((b) => !b.is_read).length ?? 0;
  const read = (bookmarks.data?.length ?? 0) - unread;

  if (bookmarks.isError) return <ErrorState error={bookmarks.error} onRetry={() => void bookmarks.refetch()} />;

  return (
    <div className="space-y-4">
      <Tabs value={view} onValueChange={(v) => setView(v as View)}>
        <TabsList>
          <TabsTrigger value="unread">Read later ({unread})</TabsTrigger>
          <TabsTrigger value="read">Read ({read})</TabsTrigger>
          <TabsTrigger value="all">All saved ({bookmarks.data?.length ?? 0})</TabsTrigger>
        </TabsList>
      </Tabs>

      {bookmarks.isLoading ? (
        <ListSkeleton rows={5} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={view === "unread" ? CheckCheck : BookmarkX}
          title={view === "unread" && (bookmarks.data?.length ?? 0) > 0 ? "All caught up" : "Nothing here yet"}
          description="Save articles from the news feed to read them later."
          action={<Button asChild size="sm" variant="outline"><Link href="/news">Browse news</Link></Button>}
        />
      ) : (
        <ul className="divide-y rounded-lg border">
          {rows.map((b) => {
            const href = safeHttpUrl(b.article_url);
            return (
              <li key={b.id} className="flex gap-3 px-4 py-3">
                <NewsThumb src={b.image_url} source={b.source} className="hidden size-16 shrink-0 rounded-md sm:block" />
                <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setPreview(b)}>
                  <p className="text-[11px] text-muted-foreground">
                    {b.source} · {b.category} · saved {formatDate(b.created_at)}
                  </p>
                  <p className={cn("mt-0.5 line-clamp-2 text-sm font-medium hover:text-primary", b.is_read && "text-muted-foreground")}>{b.title}</p>
                </button>
                <div className="flex shrink-0 items-start gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label={b.is_read ? "Mark as unread" : "Mark as read"} onClick={() => setRead.mutate({ id: b.id, read: !b.is_read })}>
                        {b.is_read ? <Mail /> : <MailOpen />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{b.is_read ? "Mark as unread" : "Mark as read"}</TooltipContent>
                  </Tooltip>
                  {href && (
                    <Button asChild variant="ghost" size="icon-sm" aria-label="Open original article">
                      <a href={href} target="_blank" rel="noreferrer noopener" onClick={() => !b.is_read && setRead.mutate({ id: b.id, read: true })}>
                        <ExternalLink />
                      </a>
                    </Button>
                  )}
                  <ConfirmDialog
                    title="Remove bookmark?"
                    description={`"${b.title}" will be removed from your saved articles.`}
                    confirmLabel="Remove"
                    onConfirm={() => remove.mutateAsync(b.id)}
                    trigger={<Button variant="ghost" size="icon-sm" aria-label="Remove bookmark"><BookmarkX /></Button>}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <NewsPreviewSheet
        article={
          preview
            ? {
                title: preview.title,
                description: preview.description,
                url: preview.article_url,
                imageUrl: preview.image_url,
                publishedAt: preview.published_at,
                source: preview.source,
                category: preview.category,
              }
            : null
        }
        saved
        onOpenChange={(o) => !o && setPreview(null)}
        onToggleSave={() => {
          if (preview) remove.mutate(preview.id);
          setPreview(null);
        }}
        onOpenOriginal={() => preview && !preview.is_read && setRead.mutate({ id: preview.id, read: true })}
      />
    </div>
  );
}
