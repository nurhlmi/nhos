"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/shared/states";
import { SourceBadge } from "@/components/shared/source-badge";
import { cn } from "@/lib/utils";
import { ChangeIndicator } from "@/features/currency/components/change-indicator";
import { useStockQuotes } from "@/features/stocks/hooks";
import { formatPrice, formatSigned } from "@/features/stocks/format";
import { formatCompact } from "@/utils/format";

/** Latest regular-market quotes. Selecting a row charts that stock. */
export function QuoteBoard({ codes, selected, onSelect }: { codes: string[]; selected: string; onSelect: (code: string) => void }) {
  const quotes = useStockQuotes(codes);

  if (quotes.isError) return <ErrorState title="Quotes unavailable" error={quotes.error} onRetry={() => void quotes.refetch()} compact />;
  if (!quotes.data) return <ListSkeleton rows={6} />;
  if (quotes.data.data.length === 0) {
    return <EmptyState title="No quotes returned" description="Yahoo Finance sent nothing for these codes. Check that they are listed on IDX." compact />;
  }

  const missing = codes.filter((c) => !quotes.data.data.some((q) => q.code === c));

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Stock</TableHead>
              <TableHead className="text-right">Last</TableHead>
              <TableHead className="text-right">Change</TableHead>
              <TableHead className="hidden text-right sm:table-cell">Day range</TableHead>
              <TableHead className="hidden text-right md:table-cell">Volume</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quotes.data.data.map((q) => {
              const isSelected = q.code === selected;
              return (
                <TableRow key={q.code} data-state={isSelected ? "selected" : undefined}>
                  <TableCell className="p-0">
                    <button
                      type="button"
                      onClick={() => onSelect(q.code)}
                      aria-pressed={isSelected}
                      aria-label={`Chart ${q.code} history`}
                      className={cn(
                        "flex min-h-11 w-full min-w-0 flex-col justify-center px-2 text-left outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring",
                        isSelected && "text-primary",
                      )}
                    >
                      <span className="font-mono text-xs font-medium">{q.code}</span>
                      {q.name && <span className="max-w-40 truncate text-[11px] text-muted-foreground">{q.name}</span>}
                    </button>
                  </TableCell>
                  <TableCell className="tabular text-right font-medium">{formatPrice(q.last)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col items-end">
                      <ChangeIndicator value={q.changePercent} />
                      <span className="tabular text-[11px] text-muted-foreground">{formatSigned(q.change)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="tabular hidden text-right text-muted-foreground sm:table-cell">
                    {q.low !== null && q.high !== null ? `${formatPrice(q.low)} to ${formatPrice(q.high)}` : "No trades yet"}
                  </TableCell>
                  <TableCell className="tabular hidden text-right text-muted-foreground md:table-cell">
                    {q.volume === null ? "n/a" : formatCompact(q.volume)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      {missing.length > 0 && <p className="text-xs text-muted-foreground">No quote for {missing.join(", ")} right now.</p>}
      <p className="text-xs text-muted-foreground">Latest session, refreshed every 5 minutes and usually about 10 minutes behind the market. Volume in shares. Select a stock to chart it.</p>
      <SourceBadge meta={quotes.data.meta} showSource={false} />
    </div>
  );
}
