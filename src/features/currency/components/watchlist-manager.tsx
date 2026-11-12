"use client";

import { useState } from "react";
import { Plus, Trash2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/shared/states";
import { CurrencySelect } from "@/features/currency/components/currency-select";
import { ChangeIndicator } from "@/features/currency/components/change-indicator";
import { useAddWatchPair, usePairQuotes, useRemoveWatchPair, useWatchlist } from "@/features/currency/hooks";
import { pairSchema } from "@/features/currency/schemas";
import { formatRate } from "@/utils/format";
import { toast } from "sonner";

export function WatchlistManager() {
  const watchlist = useWatchlist();
  const add = useAddWatchPair();
  const remove = useRemoveWatchPair();
  const [base, setBase] = useState("JPY");
  const [quote, setQuote] = useState("IDR");

  const rows = watchlist.data ?? [];
  const quotes = usePairQuotes(rows.map((r) => ({ base: r.base_currency, quote: r.quote_currency })));

  const onAdd = () => {
    const parsed = pairSchema.safeParse({ base, quote });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid pair");
      return;
    }
    const position = rows.length ? Math.max(...rows.map((r) => r.position)) + 1 : 0;
    add.mutate({ ...parsed.data, position });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <CurrencySelect value={base} onChange={setBase} exclude={quote} className="w-24" aria-label="Watchlist base currency" />
        <span className="pb-2 text-muted-foreground">/</span>
        <CurrencySelect value={quote} onChange={setQuote} exclude={base} className="w-24" aria-label="Watchlist quote currency" />
        <Button onClick={onAdd} disabled={add.isPending}>
          <Plus /> Add pair
        </Button>
      </div>

      {watchlist.isError ? (
        <ErrorState error={watchlist.error} onRetry={() => void watchlist.refetch()} compact />
      ) : watchlist.isLoading ? (
        <ListSkeleton rows={3} />
      ) : rows.length === 0 ? (
        <EmptyState icon={Star} title="Watchlist is empty" description="Add a currency pair to track it here and on the overview." compact />
      ) : (
        <ul className="divide-y rounded-lg border">
          {rows.map((row) => {
            const q = quotes.data?.data.find((x) => x.base === row.base_currency && x.quote === row.quote_currency);
            return (
              <li key={row.id} className="flex items-center gap-3 px-3 py-2.5">
                <span className="w-20 font-mono text-xs font-medium">
                  {row.base_currency}/{row.quote_currency}
                </span>
                <span className="tabular flex-1 text-sm">
                  {q ? formatRate(q.rate) : quotes.isLoading ? "…" : <span className="text-muted-foreground">unavailable</span>}
                </span>
                <ChangeIndicator value={q?.changePercent ?? null} />
                <ConfirmDialog
                  title="Remove pair?"
                  description={`${row.base_currency}/${row.quote_currency} will be removed from your watchlist.`}
                  confirmLabel="Remove"
                  onConfirm={() => remove.mutateAsync(row)}
                  trigger={
                    <Button variant="ghost" size="icon-sm" aria-label={`Remove ${row.base_currency}/${row.quote_currency}`}>
                      <Trash2 />
                    </Button>
                  }
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
