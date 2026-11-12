"use client";

import { EmptyState, ErrorState, ListSkeleton } from "@/components/shared/states";
import { AssetForm } from "@/features/assets/components/asset-form";
import { useAsset } from "@/features/assets/hooks";

export function AssetEditLoader({ id }: { id: string }) {
  const { data, isLoading, isError, error, refetch } = useAsset(id);
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (isLoading) return <ListSkeleton rows={6} />;
  if (!data) return <EmptyState title="Asset not found" />;
  return <AssetForm asset={data} />;
}
