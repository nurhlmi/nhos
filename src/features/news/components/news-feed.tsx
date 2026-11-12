"use client";

import { useMemo, useState } from "react";
import { subDays } from "date-fns";
import { Newspaper, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { Pager } from "@/components/shared/pager";
import { SourceBadge } from "@/components/shared/source-badge";
import { cn } from "@/lib/utils";
import { FEED_SOURCES, NEWS_CATEGORIES, type NewsArticle } from "@/features/news/feeds";
import { useNews, useNewsBookmarks, useRemoveBookmark, useSaveArticle } from "@/features/news/hooks";
import { NewsCard } from "@/features/news/components/news-card";
import { NewsPreviewSheet } from "@/features/news/components/news-preview-sheet";

const ALL = "all";
const DATE_RANGES = [
  { value: ALL, label: "Any time" },
  { value: "1", label: "Last 24 hours" },
  { value: "3", label: "Last 3 days" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
];
const PAGE_SIZE = 20;

export function NewsFeed() {
  const news = useNews();
  const bookmarks = useNewsBookmarks();
  const save = useSaveArticle();
  const remove = useRemoveBookmark();
  const [category, setCategory] = useState<string>(ALL);
  const [source, setSource] = useState<string>(ALL);
  const [range, setRange] = useState<string>(ALL);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [preview, setPreview] = useState<NewsArticle | null>(null);

  const savedByUrl = useMemo(() => new Map((bookmarks.data ?? []).map((b) => [b.article_url, b])), [bookmarks.data]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const since = range === ALL ? null : subDays(new Date(), Number(range)).toISOString();
    return (news.data?.data.articles ?? []).filter(
      (a) =>
        (category === ALL || a.category === category) &&
        (source === ALL || a.sourceId === source) &&
        (!since || (a.publishedAt ?? "") >= since) &&
        (!term || a.title.toLowerCase().includes(term) || a.description.toLowerCase().includes(term)),
    );
  }, [news.data, category, source, range, q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const sources = FEED_SOURCES.filter((s) => category === ALL || s.category === category);

  const toggleSave = (a: NewsArticle) => {
    const existing = savedByUrl.get(a.url);
    if (existing) remove.mutate(existing.id);
    else save.mutate(a);
  };
  const reset = (fn: () => void) => {
    fn();
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1" role="tablist" aria-label="News categories">
        {[ALL, ...NEWS_CATEGORIES].map((c) => (
          <button
            key={c}
            role="tab"
            aria-selected={category === c}
            onClick={() => reset(() => { setCategory(c); setSource(ALL); })}
            className={cn(
              "h-8 pointer-coarse:h-11 pointer-coarse:min-w-11 shrink-0 rounded-md border px-3 text-xs whitespace-nowrap transition-colors",
              category === c ? "border-primary/40 bg-primary/10 font-medium text-primary" : "bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {c === ALL ? "All" : c}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => reset(() => setQ(e.target.value))} placeholder="Search headlines" className="pl-8" aria-label="Search headlines" />
        </div>
        <Select value={source} onValueChange={(v) => reset(() => setSource(v))}>
          <SelectTrigger className="w-52" aria-label="Source"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All sources</SelectItem>
            {sources.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={range} onValueChange={(v) => reset(() => setRange(v))}>
          <SelectTrigger className="w-40" aria-label="Date"><SelectValue /></SelectTrigger>
          <SelectContent>
            {DATE_RANGES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {news.isError ? (
        <ErrorState error={news.error} onRetry={() => void news.refetch()} />
      ) : news.isLoading ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-[106px] w-full" />)}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState icon={Newspaper} title="No articles match" description="Try another category, source or date range." />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {rows.map((a) => (
            <NewsCard key={a.id} article={a} saved={savedByUrl.has(a.url)} onOpen={() => setPreview(a)} onToggleSave={() => toggleSave(a)} />
          ))}
        </div>
      )}

      {filtered.length > 0 && <Pager page={current} totalPages={totalPages} total={filtered.length} label="articles" onPageChange={setPage} />}

      <div id="sources" className="flex flex-col gap-2 border-t pt-3 sm:flex-row sm:items-start sm:justify-between">
        <SourceBadge meta={news.data?.meta} showSource={false} />
        {news.data && (
          <p className="text-[11px] text-muted-foreground sm:max-w-xl sm:text-right">
            Sources:{" "}
            {news.data.data.feeds.map((f, i) => (
              <span key={f.id} className={f.ok ? undefined : "text-destructive line-through"} title={f.error}>
                {f.name}
                {i < news.data.data.feeds.length - 1 ? ", " : ""}
              </span>
            ))}
          </p>
        )}
      </div>

      <NewsPreviewSheet
        article={preview}
        saved={preview ? savedByUrl.has(preview.url) : false}
        onOpenChange={(o) => !o && setPreview(null)}
        onToggleSave={() => preview && toggleSave(preview)}
      />
    </div>
  );
}
