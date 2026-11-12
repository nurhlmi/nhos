"use client";

import { useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { differenceInMonths, parseISO } from "date-fns";
import { ImagePlus, Pencil, Trash2, X, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState, ErrorState, StatSkeleton } from "@/components/shared/states";
import { StatCard } from "@/components/shared/stat-card";
import { WidgetCard } from "@/components/shared/widget-card";
import { formatCurrency, formatDate } from "@/utils/format";
import { categoryLabel } from "@/features/assets/constants";
import { useAsset, useAssetImage, useAssetImageMutations, useDeleteAsset } from "@/features/assets/hooks";
import { AssetStatusBadge } from "@/features/assets/components/asset-badges";

function ownedFor(purchaseDate: string) {
  const months = Math.max(0, differenceInMonths(new Date(), parseISO(purchaseDate)));
  const years = Math.floor(months / 12);
  return years > 0 ? `${years}y ${months % 12}m` : `${months}m`;
}

export function AssetDetail({ id }: { id: string }) {
  const router = useRouter();
  const assetQuery = useAsset(id);
  const del = useDeleteAsset();

  if (assetQuery.isError) return <ErrorState error={assetQuery.error} onRetry={() => void assetQuery.refetch()} />;
  if (assetQuery.isLoading) return <StatSkeleton />;
  if (!assetQuery.data)
    return (
      <EmptyState
        title="Asset not found"
        description="It may have been deleted."
        action={<Button asChild size="sm" variant="outline"><Link href="/assets">Back to assets</Link></Button>}
      />
    );

  const asset = assetQuery.data;
  const cost = Number(asset.purchase_price);

  return (
    <>
      <PageHeader
        title={asset.name}
        description={`${categoryLabel(asset.category)} · purchased ${formatDate(asset.purchase_date)}`}
        actions={
          <>
            <AssetStatusBadge status={asset.status} />
            <Button asChild variant="outline" size="sm">
              <Link href={`/assets/${asset.id}/edit`}><Pencil /> Edit</Link>
            </Button>
            <ConfirmDialog
              title={`Delete ${asset.name}?`}
              description="The asset and its image will be permanently deleted. This cannot be undone."
              onConfirm={async () => {
                await del.mutateAsync(asset);
                router.push("/assets");
              }}
              trigger={<Button variant="destructive" size="sm"><Trash2 /> Delete</Button>}
            />
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard label="Acquisition cost" value={formatCurrency(cost)} hint={`Purchased ${formatDate(asset.purchase_date)}`} />
        <StatCard label="Owned for" value={ownedFor(asset.purchase_date)} hint={`Since ${formatDate(asset.purchase_date, "MMM yyyy")}`} />
        <StatCard label="Category" value={categoryLabel(asset.category)} className="col-span-2 lg:col-span-1" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <AssetImageCard assetId={asset.id} />
        <WidgetCard title="Details">
          <dl className="space-y-3 text-sm">
            <Info label="Description" value={asset.description || "None"} />
            <Info label="Notes" value={asset.notes || "None"} />
            <Info label="Last updated" value={formatDate(asset.updated_at, "dd MMM yyyy, HH:mm")} />
          </dl>
        </WidgetCard>
      </div>
    </>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="tabular mt-0.5 break-words whitespace-pre-line">{value}</dd>
    </div>
  );
}

function AssetImageCard({ assetId }: { assetId: string }) {
  const { data: asset } = useAsset(assetId);
  const image = useAssetImage(asset?.image_path ?? null);
  const { upload, remove } = useAssetImageMutations();
  const inputRef = useRef<HTMLInputElement>(null);
  if (!asset) return null;

  return (
    <WidgetCard
      title="Image"
      actions={
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) upload.mutate({ asset, file });
              e.target.value = "";
            }}
          />
          <Button variant="ghost" size="sm" onClick={() => inputRef.current?.click()} disabled={upload.isPending}>
            <ImagePlus /> {asset.image_path ? "Replace" : "Upload"}
          </Button>
          {asset.image_path && (
            <Button variant="ghost" size="icon-sm" aria-label="Remove image" onClick={() => remove.mutate(asset)} disabled={remove.isPending}>
              <X />
            </Button>
          )}
        </>
      }
    >
      {!asset.image_path ? (
        <EmptyState icon={ImageOff} title="No image attached" description="PNG, JPG, WebP or GIF up to 5 MB." compact />
      ) : image.isLoading || upload.isPending ? (
        <Skeleton className="aspect-video w-full" />
      ) : image.data ? (
        // eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL from private storage
        <img src={image.data} alt={asset.name} className="aspect-video w-full rounded-md object-cover" />
      ) : (
        <EmptyState icon={ImageOff} title="Image unavailable" compact />
      )}
    </WidgetCard>
  );
}
