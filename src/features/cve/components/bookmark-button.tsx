"use client";

import { Bookmark, BookmarkCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useCveBookmarks, useToggleBookmark } from "@/features/cve/hooks";
import type { CveSummary } from "@/features/cve/types";

export function CveBookmarkButton({ cve, withLabel = false }: { cve: CveSummary; withLabel?: boolean }) {
  const bookmarks = useCveBookmarks();
  const toggle = useToggleBookmark();
  const bookmark = bookmarks.data?.find((b) => b.cve_id === cve.id);
  const label = bookmark ? "Remove from watchlist" : "Add to watchlist";

  const button = (
    <Button
      variant={withLabel ? (bookmark ? "secondary" : "outline") : "ghost"}
      size={withLabel ? "sm" : "icon-sm"}
      aria-label={label}
      aria-pressed={Boolean(bookmark)}
      disabled={toggle.isPending || bookmarks.isLoading}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle.mutate({ cve, bookmark });
      }}
    >
      {bookmark ? <BookmarkCheck className="text-primary" /> : <Bookmark />}
      {withLabel && (bookmark ? "Watching" : "Watch")}
    </Button>
  );

  if (withLabel) return button;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
