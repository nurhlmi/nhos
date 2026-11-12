"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { AssetRow } from "@/types/database";
import * as api from "@/features/assets/api";
import type { AssetFormValues } from "@/features/assets/schemas";

export const assetKeys = {
  all: ["assets"] as const,
  list: ["assets", "list"] as const,
  detail: (id: string) => ["assets", "detail", id] as const,
  image: (path: string) => ["assets", "image", path] as const,
};

export function useAssets() {
  const query = useQuery({ queryKey: assetKeys.list, queryFn: api.listAssets });
  return { ...query, assets: query.data ?? [] };
}

export type AssetTotals = {
  acquisitionCost: number;
  totalAssets: number;
  activeAssets: number;
  heldAssets: number;
};

export const isHeld = (a: Pick<AssetRow, "status">) => a.status === "active" || a.status === "inactive";

/** Acquisition cost counts assets still held (active or inactive). */
export function computeTotals(assets: AssetRow[]): AssetTotals {
  const held = assets.filter(isHeld);
  return {
    acquisitionCost: held.reduce((s, a) => s + Number(a.purchase_price), 0),
    totalAssets: assets.length,
    activeAssets: assets.filter((a) => a.status === "active").length,
    heldAssets: held.length,
  };
}

export function useAsset(id: string) {
  return useQuery({ queryKey: assetKeys.detail(id), queryFn: () => api.getAsset(id) });
}

export function useAssetImage(path: string | null) {
  return useQuery({
    queryKey: assetKeys.image(path ?? ""),
    queryFn: () => api.getSignedImageUrl(path!),
    enabled: Boolean(path),
    staleTime: 50 * 60 * 1000,
  });
}

export function useSaveAsset(id?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: AssetFormValues) => (id ? api.updateAsset(id, values) : api.createAsset(values)),
    onSuccess: (asset) => {
      toast.success(id ? "Asset updated" : "Asset created");
      qc.setQueryData(assetKeys.detail(asset.id), asset);
      void qc.invalidateQueries({ queryKey: assetKeys.all });
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useDeleteAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteAsset,
    onSuccess: (_d, asset) => {
      toast.success(`${asset.name} deleted`);
      void qc.invalidateQueries({ queryKey: assetKeys.all });
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useAssetImageMutations() {
  const qc = useQueryClient();
  const onSuccess = (asset: AssetRow) => {
    qc.setQueryData(assetKeys.detail(asset.id), asset);
    void qc.invalidateQueries({ queryKey: assetKeys.list });
  };
  const upload = useMutation({
    mutationFn: ({ asset, file }: { asset: AssetRow; file: File }) => api.uploadAssetImage(asset, file),
    onSuccess: (a) => {
      toast.success("Image uploaded");
      onSuccess(a);
    },
    onError: (e) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: api.removeAssetImage,
    onSuccess: (a) => {
      toast.success("Image removed");
      onSuccess(a);
    },
    onError: (e) => toast.error(e.message),
  });
  return { upload, remove };
}
