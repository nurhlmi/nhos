"use client";

import { Bookmark, BookmarkCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatRelative } from "@/utils/format";
import type { NewsArticle } from "@/features/news/feeds";
import { NewsThumb } from "@/features/news/components/news-thumb";

export function NewsCard({
  article,
  saved,
  onOpen,
  onToggleSave,
}: {
  article: NewsArticle;
  saved: boolean;
  onOpen: () => void;
  onToggleSave: () => void;
}) {
  return (
    <article className="group flex gap-3 rounded-lg border bg-card p-3 transition-colors hover:border-primary/30">
      <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 gap-3 text-left" aria-label={`Preview: ${article.title}`}>
        <NewsThumb src={article.imageUrl} source={article.source} className="size-20 shrink-0 rounded-md sm:h-20 sm:w-28" />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] text-muted-foreground">
            <span className="font-medium text-foreground/80">{article.source}</span> · {article.category} · {formatRelative(article.publishedAt)}
          </p>
          <h3 className="mt-1 line-clamp-2 text-sm leading-snug font-medium group-hover:text-primary">{article.title}</h3>
          {article.description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{article.description}</p>}
        </div>
      </button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={saved ? "Remove bookmark" : "Save for later"}
        aria-pressed={saved}
        onClick={onToggleSave}
        className="shrink-0"
      >
        {saved ? <BookmarkCheck className="text-primary" /> : <Bookmark />}
      </Button>
    </article>
  );
}
