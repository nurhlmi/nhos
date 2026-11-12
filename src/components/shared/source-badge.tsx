"use client";

import { APP_NAME } from "@/lib/env";
import { Database, Radio, Clock3, ExternalLink } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { SourceMeta } from "@/types/api";
import { formatDateTime, formatRelative } from "@/utils/format";
import { cn } from "@/lib/utils";

const freshnessLabel = {
  live: { label: "Live fetch", icon: Radio, className: "text-success" },
  cached: { label: "Cached", icon: Database, className: "text-primary" },
  stale: { label: "Stale", icon: Clock3, className: "text-warning" },
} as const;

/** Shows where external data came from and how fresh it is. */
export function SourceBadge({ meta, className, showSource = true }: { meta?: SourceMeta; className?: string; showSource?: boolean }) {
  if (!meta) return null;
  const f = freshnessLabel[meta.freshness];
  const Icon = f.icon;

  return (
    <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground", className)}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1">
            <Icon className={cn("size-3", f.className)} />
            {f.label} · {formatRelative(meta.fetchedAt)}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p>Fetched by {APP_NAME}: {formatDateTime(meta.fetchedAt)}</p>
          {meta.sourceUpdatedAt && <p>Source updated: {formatDateTime(meta.sourceUpdatedAt)}</p>}
          {meta.note && <p className="mt-1 opacity-80">{meta.note}</p>}
        </TooltipContent>
      </Tooltip>
      {showSource && (
        <a href={meta.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-foreground">
          {meta.source} <ExternalLink className="size-3" />
        </a>
      )}
    </div>
  );
}
