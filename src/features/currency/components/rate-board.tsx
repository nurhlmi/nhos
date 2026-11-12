"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ErrorState, ListSkeleton } from "@/components/shared/states";
import { SourceBadge } from "@/components/shared/source-badge";
import { ChangeIndicator } from "@/features/currency/components/change-indicator";
import { usePairQuotes } from "@/features/currency/hooks";
import type { CurrencyPair } from "@/features/currency/types";
import { formatDate, formatRate } from "@/utils/format";

/** Exchange-rate monitoring table with change vs. previous fixing. */
export function RateBoard({ pairs }: { pairs: CurrencyPair[] }) {
  const quotes = usePairQuotes(pairs);

  if (quotes.isError) return <ErrorState error={quotes.error} onRetry={() => void quotes.refetch()} />;
  if (quotes.isLoading || !quotes.data) return <ListSkeleton rows={pairs.length || 4} />;

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pair</TableHead>
              <TableHead className="text-right">Rate</TableHead>
              <TableHead className="text-right">Previous</TableHead>
              <TableHead className="text-right">Change</TableHead>
              <TableHead className="hidden text-right sm:table-cell">Reference date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quotes.data.data.map((q) => (
              <TableRow key={`${q.base}-${q.quote}`}>
                <TableCell className="font-mono text-xs font-medium">
                  {q.base}/{q.quote}
                </TableCell>
                <TableCell className="tabular text-right font-medium">{formatRate(q.rate)}</TableCell>
                <TableCell className="tabular text-right text-muted-foreground">
                  {q.previousRate !== null ? formatRate(q.previousRate) : "n/a"}
                </TableCell>
                <TableCell className="text-right">
                  <ChangeIndicator value={q.changePercent} />
                </TableCell>
                <TableCell className="hidden text-right text-xs text-muted-foreground sm:table-cell">
                  {formatDate(q.date)}
                  {q.previousDate && <span className="block">vs {formatDate(q.previousDate)}</span>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {quotes.data.data.length < pairs.length && (
        <p className="text-xs text-warning">Some pairs are not published by the source and are hidden.</p>
      )}
      <SourceBadge meta={quotes.data.meta} />
    </div>
  );
}
