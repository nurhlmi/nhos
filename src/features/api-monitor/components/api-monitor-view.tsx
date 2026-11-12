"use client";

import { useState } from "react";
import { RotateCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/shared/states";
import { useApiMonitor, useRecheckApis } from "@/features/api-monitor/hooks";
import type { ApiCheck, ApiStatus } from "@/features/api-monitor/types";
import { formatDateTime, formatRelative } from "@/utils/format";
import { APP_NAME } from "@/lib/env";
import { cn } from "@/lib/utils";

const statusStyle: Record<ApiStatus, { label: string; className: string; rank: number }> = {
  down: { label: "Offline", className: "bg-destructive/10 text-destructive dark:bg-destructive/20", rank: 0 },
  error: { label: "Error", className: "bg-warning/10 text-warning", rank: 1 },
  unconfigured: { label: "Key missing", className: "bg-warning/10 text-warning", rank: 2 },
  up: { label: "Online", className: "bg-success/10 text-success", rank: 3 },
};

type Filter = "all" | "issues";

function StatusCell({ check }: { check: ApiCheck }) {
  const s = statusStyle[check.status];
  const detail = [check.httpStatus !== null ? `HTTP ${check.httpStatus}` : null, check.latencyMs !== null ? `${check.latencyMs} ms` : null]
    .filter(Boolean)
    .join(" · ");
  return (
    <div className="flex flex-col items-start gap-1">
      <Badge className={s.className}>{s.label}</Badge>
      {detail && <span className="tabular text-[11px] text-muted-foreground">{detail}</span>}
      {check.message && check.status !== "up" && <span className="max-w-56 text-[11px] text-muted-foreground">{check.message}</span>}
    </div>
  );
}

function KeyCell({ check }: { check: ApiCheck }) {
  if (!check.key) return <span className="text-muted-foreground">No</span>;
  const note = check.key.configured ? "Set" : check.key.required ? "Not set" : "Optional, not set";
  return (
    <div className="flex flex-col">
      <span className="font-medium">Yes</span>
      <span className={cn("text-[11px]", check.key.configured ? "text-muted-foreground" : "text-warning")}>{note}</span>
    </div>
  );
}

export function ApiMonitorView() {
  const monitor = useApiMonitor();
  const recheck = useRecheckApis();
  const [filter, setFilter] = useState<Filter>("all");

  if (monitor.isError) return <ErrorState title="Checks unavailable" error={monitor.error} onRetry={() => void monitor.refetch()} />;
  if (!monitor.data) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Sending a request to each API. The slowest ones can take up to 30 seconds.</p>
        <ListSkeleton rows={8} />
      </div>
    );
  }

  const { checks, checkedAt } = monitor.data;
  const issues = checks.filter((c) => c.status !== "up");
  const online = checks.length - issues.length;
  const rows = (filter === "issues" ? issues : checks)
    .map((c, i) => ({ c, i }))
    .sort((a, b) => statusStyle[a.c.status].rank - statusStyle[b.c.status].rank || a.i - b.i)
    .map(({ c }) => c);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm">
            <span className="font-semibold">{online}</span> of {checks.length} APIs online
            {issues.length > 0 && (
              <>
                , <span className="font-semibold text-destructive">{issues.length}</span> need attention
              </>
            )}
          </p>
          <p className="text-xs text-muted-foreground" title={formatDateTime(checkedAt)}>
            Checked {formatRelative(checkedAt)}. Rechecked automatically every 5 minutes.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div role="group" aria-label="Filter APIs" className="flex rounded-md border p-0.5">
            {(["all", "issues"] as const).map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
                className={cn(
                  "min-h-9 rounded-[5px] px-3 text-xs font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
                  filter === f && "bg-muted text-foreground",
                )}
              >
                {f === "all" ? `All (${checks.length})` : `Issues (${issues.length})`}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" className="min-h-9" onClick={() => recheck.mutate()} disabled={recheck.isPending}>
            <RotateCw className={cn(recheck.isPending && "animate-spin")} />
            {recheck.isPending ? "Checking" : "Check now"}
          </Button>
        </div>
      </div>

      {recheck.isError && (
        <p role="alert" className="text-xs text-destructive">
          Recheck failed: {recheck.error instanceof Error ? recheck.error.message : "unknown error"}. Showing the previous results.
        </p>
      )}

      {rows.length === 0 ? (
        <EmptyState title="Every API is online" description="No API failed its last check. Switch to All to see the full list." compact />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>API</TableHead>
                <TableHead className="hidden md:table-cell">API URL</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>API key</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="align-top">
                    <div className="flex min-w-0 flex-col">
                      <span className="font-medium">{c.name}</span>
                      <span className="text-[11px] text-muted-foreground">{c.feature}</span>
                      <span className="mt-0.5 max-w-52 truncate font-mono text-[11px] text-muted-foreground md:hidden" title={c.url}>
                        {c.url}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden align-top md:table-cell">
                    <span className="block max-w-[28rem] truncate font-mono text-xs text-muted-foreground" title={c.url}>
                      {c.url}
                    </span>
                  </TableCell>
                  <TableCell className="align-top">
                    <StatusCell check={c} />
                  </TableCell>
                  <TableCell className="align-top">
                    <KeyCell check={c} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Each check is one request from the {APP_NAME} server; only the response status is read. Key values are never shown here.
      </p>
    </div>
  );
}
