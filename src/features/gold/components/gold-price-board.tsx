"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/states";
import { cn } from "@/lib/utils";
import { formatIdr, formatWeight } from "@/features/gold/format";
import type { GoldProduct } from "@/features/gold/types";
import { formatNumber } from "@/utils/format";

/** Today's price list for one product line. Selecting a row charts that weight. */
export function GoldPriceBoard({
  products,
  type,
  onTypeChange,
  weight,
  onWeightChange,
}: {
  products: GoldProduct[];
  type: string;
  onTypeChange: (type: string) => void;
  weight: number | null;
  onWeightChange: (weight: number) => void;
}) {
  const product = products.find((p) => p.type === type);

  return (
    <div className="space-y-3">
      <Select value={type} onValueChange={onTypeChange}>
        <SelectTrigger aria-label="Product line" className="w-full sm:w-64">
          <SelectValue placeholder="Product line" />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {products.map((p) => (
            <SelectItem key={p.type} value={p.type}>
              {p.type}
              <span className="text-muted-foreground">{p.items.length} weights</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {!product || product.items.length === 0 ? (
        <EmptyState title="No prices for this product line" description="Galeri 24 lists no weights for it today. Pick another product line." compact />
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Weight</TableHead>
                  <TableHead className="text-right">Selling</TableHead>
                  <TableHead className="text-right">Buyback</TableHead>
                  <TableHead className="hidden text-right sm:table-cell">Per gram</TableHead>
                  <TableHead className="hidden text-right sm:table-cell">Spread</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {product.items.map((item) => {
                  const selected = item.weight === weight;
                  const unavailable = item.sell === null && item.buyback === null;
                  const spread = item.sell && item.buyback ? ((item.sell - item.buyback) / item.sell) * 100 : null;
                  return (
                    <TableRow key={item.weight} data-state={selected ? "selected" : undefined}>
                      <TableCell className="p-0">
                        <button
                          type="button"
                          onClick={() => onWeightChange(item.weight)}
                          aria-pressed={selected}
                          aria-label={`Chart ${formatWeight(item.weight)} history`}
                          className={cn(
                            "tabular flex min-h-11 w-full items-center px-2 text-left text-sm font-medium outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring",
                            selected && "text-primary",
                          )}
                        >
                          {formatWeight(item.weight)}
                        </button>
                      </TableCell>
                      {unavailable ? (
                        <TableCell colSpan={2} className="text-right text-xs text-muted-foreground">
                          Out of stock today
                        </TableCell>
                      ) : (
                        <>
                          <TableCell className="tabular text-right font-medium">{formatIdr(item.sell)}</TableCell>
                          <TableCell className="tabular text-right text-muted-foreground">{formatIdr(item.buyback)}</TableCell>
                        </>
                      )}
                      <TableCell className="tabular hidden text-right text-muted-foreground sm:table-cell">
                        {item.sell ? formatIdr(Math.round(item.sell / item.weight)) : "n/a"}
                      </TableCell>
                      <TableCell className="tabular hidden text-right text-muted-foreground sm:table-cell">
                        {spread !== null ? `${formatNumber(spread, 1)}%` : "n/a"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <p className="text-xs text-muted-foreground">
            Selling is what Galeri 24 charges, buyback is what it pays you. Spread is the share of the selling price you lose
            when buying and reselling the same day. Select a weight to chart it.
          </p>
        </>
      )}
    </div>
  );
}
