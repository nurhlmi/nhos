"use client";

import { Bookmark, BookmarkCheck, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatDateTime } from "@/utils/format";
import { safeHttpUrl } from "@/utils/validators";
import { NewsThumb } from "@/features/news/components/news-thumb";

export type PreviewArticle = {
  title: string;
  description: string | null;
  url: string;
  imageUrl: string | null;
  publishedAt: string | null;
  source: string;
  category: string;
  sourceHomepage?: string;
};

export function NewsPreviewSheet({
  article,
  saved,
  onOpenChange,
  onToggleSave,
  onOpenOriginal,
}: {
  article: PreviewArticle | null;
  saved: boolean;
  onOpenChange: (open: boolean) => void;
  onToggleSave: () => void;
  onOpenOriginal?: () => void;
}) {
  const href = safeHttpUrl(article?.url);
  return (
    <Sheet open={Boolean(article)} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {article && (
          <>
            <SheetHeader>
              <p className="text-xs text-muted-foreground">
                {article.category} · {formatDateTime(article.publishedAt)}
              </p>
              <SheetTitle className="text-lg leading-snug">{article.title}</SheetTitle>
              <SheetDescription>
                Source:{" "}
                {article.sourceHomepage ? (
                  <a href={article.sourceHomepage} target="_blank" rel="noreferrer" className="font-medium text-foreground hover:underline">
                    {article.source}
                  </a>
                ) : (
                  <span className="font-medium text-foreground">{article.source}</span>
                )}
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-4 px-4 pb-6">
              {article.imageUrl && <NewsThumb src={article.imageUrl} source={article.source} className="aspect-video w-full rounded-lg" />}
              <p className="text-sm leading-relaxed text-muted-foreground">
                {article.description || "The publisher's feed does not include a summary for this article."}
              </p>
              <p className="rounded-md bg-muted px-3 py-2 text-[11px] text-muted-foreground">
                Preview from the publisher&apos;s RSS feed. Read the full article on {article.source}.
              </p>
              <div className="flex gap-2">
                {href && (
                  <Button asChild className="flex-1" onClick={onOpenOriginal}>
                    <a href={href} target="_blank" rel="noreferrer noopener">
                      Open original article <ExternalLink />
                    </a>
                  </Button>
                )}
                <Button variant="outline" onClick={onToggleSave}>
                  {saved ? <BookmarkCheck className="text-primary" /> : <Bookmark />}
                  {saved ? "Saved" : "Save"}
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
