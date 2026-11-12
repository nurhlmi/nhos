"use client";

import { ErrorState, StatSkeleton, ListSkeleton } from "@/components/shared/states";
import { WidgetCard } from "@/components/shared/widget-card";
import { computeTotals, useAssets } from "@/features/assets/hooks";
import { AssetStats } from "@/features/assets/components/asset-stats";
import { AssetList } from "@/features/assets/components/asset-list";

export function AssetsDashboard() {
  const { assets, isLoading, isError, error, refetch } = useAssets();

  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (isLoading)
    return (
      <div className="space-y-4">
        <StatSkeleton />
        <ListSkeleton rows={6} />
      </div>
    );

  return (
    <div className="space-y-4">
      <AssetStats totals={computeTotals(assets)} assets={assets} />
      <WidgetCard title="All assets" className="min-w-0">
        <AssetList assets={assets} />
      </WidgetCard>
    </div>
  );
}
