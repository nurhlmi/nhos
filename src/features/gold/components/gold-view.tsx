"use client";

import { useState } from "react";
import { WidgetCard } from "@/components/shared/widget-card";
import { ErrorState, ListSkeleton } from "@/components/shared/states";
import { SourceBadge } from "@/components/shared/source-badge";
import { DEFAULT_GOLD_TYPE, DEFAULT_GOLD_WEIGHT } from "@/features/gold/constants";
import { useGoldBoard } from "@/features/gold/hooks";
import { GoldHistoryChart } from "@/features/gold/components/gold-history-chart";
import { GoldPriceBoard } from "@/features/gold/components/gold-price-board";
import type { GoldProduct } from "@/features/gold/types";
import { formatDate } from "@/utils/format";

function defaultWeight(product: GoldProduct | undefined): number | null {
  if (!product?.items.length) return null;
  return product.items.find((i) => i.weight === DEFAULT_GOLD_WEIGHT)?.weight ?? product.items[0]!.weight;
}

export function GoldView() {
  const board = useGoldBoard();
  const products = board.data?.data.products ?? [];
  const [picked, setPicked] = useState<{ type: string; weight: number | null } | null>(null);

  const type = picked?.type ?? (products.some((p) => p.type === DEFAULT_GOLD_TYPE) ? DEFAULT_GOLD_TYPE : (products[0]?.type ?? null));
  const product = products.find((p) => p.type === type);
  const weight = picked ? picked.weight : defaultWeight(product);

  return (
    <div className="grid gap-4 xl:grid-cols-5">
      <WidgetCard title="Price history" className="xl:col-span-3">
        {board.isError ? (
          <ErrorState title="Gold prices unavailable" error={board.error} onRetry={() => void board.refetch()} />
        ) : !type ? (
          <ListSkeleton rows={6} />
        ) : (
          <GoldHistoryChart type={type} weight={weight} />
        )}
      </WidgetCard>
      <WidgetCard
        title={board.data?.data.date ? `Price list, ${formatDate(board.data.data.date)}` : "Price list"}
        className="xl:col-span-2"
        footer={<SourceBadge meta={board.data?.meta} />}
      >
        {board.isError ? (
          <ErrorState title="Gold prices unavailable" error={board.error} onRetry={() => void board.refetch()} compact />
        ) : board.isLoading || !type ? (
          <ListSkeleton rows={8} />
        ) : (
          <GoldPriceBoard
            products={products}
            type={type}
            onTypeChange={(t) => setPicked({ type: t, weight: defaultWeight(products.find((p) => p.type === t)) })}
            weight={weight}
            onWeightChange={(w) => setPicked({ type, weight: w })}
          />
        )}
      </WidgetCard>
    </div>
  );
}
