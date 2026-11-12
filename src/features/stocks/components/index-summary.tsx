"use client";

import { ErrorState, ListSkeleton } from "@/components/shared/states";
import { SourceBadge } from "@/components/shared/source-badge";
import { ChangeIndicator } from "@/features/currency/components/change-indicator";
import { useIndexSnapshot } from "@/features/stocks/hooks";
import { formatIndex, formatSigned } from "@/features/stocks/format";
import { formatDate } from "@/utils/format";

/** IHSG level and its move against the previous session. */
export function IndexSummary() {
  const index = useIndexSnapshot();
  const d = index.data?.data;

  if (index.isError) return <ErrorState title="IHSG unavailable" error={index.error} onRetry={() => void index.refetch()} compact />;
  if (!d) return <ListSkeleton rows={4} />;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[11px] text-muted-foreground">IDX Composite{d.date ? `, ${formatDate(d.date, "EEE, dd MMM yyyy")}` : ""}</p>
        <p className="tabular mt-0.5 text-2xl font-semibold tracking-tight">{formatIndex(d.last)}</p>
        <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
          <ChangeIndicator value={d.changePercent} />
          <span className="tabular">{formatSigned(d.change, 2)}</span>
          <span>vs previous close {formatIndex(d.prev)}</span>
        </p>
      </div>
      <dl className="grid grid-cols-3 gap-2">
        <Cell label="Open" value={formatIndex(d.open)} />
        <Cell label="High" value={formatIndex(d.high)} />
        <Cell label="Low" value={formatIndex(d.low)} />
      </dl>
      <SourceBadge meta={index.data?.meta} />
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg bg-surface-2 px-3 py-2">
      <dt className="truncate text-[11px] text-muted-foreground">{label}</dt>
      <dd className="tabular mt-0.5 truncate text-sm font-semibold">{value}</dd>
    </div>
  );
}
