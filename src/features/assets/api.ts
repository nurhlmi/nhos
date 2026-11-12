"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { AssetRow } from "@/types/database";
import { ASSET_IMAGE_BUCKET, MAX_ASSET_IMAGE_BYTES } from "@/features/assets/constants";
import type { AssetFormValues } from "@/features/assets/schemas";

const db = () => getSupabaseBrowserClient();

function toError(error: { message: string }, fallback?: string) {
  return new Error(fallback ?? error.message);
}

export async function listAssets(): Promise<AssetRow[]> {
  const { data, error } = await db().from("assets").select("*").order("created_at", { ascending: false });
  if (error) throw toError(error);
  return data;
}

export async function getAsset(id: string): Promise<AssetRow | null> {
  const { data, error } = await db().from("assets").select("*").eq("id", id).maybeSingle();
  if (error) throw toError(error);
  return data;
}

function toRow(values: AssetFormValues) {
  return {
    ...values,
    description: values.description || null,
    notes: values.notes || null,
  };
}

export async function createAsset(values: AssetFormValues): Promise<AssetRow> {
  const { data, error } = await db().from("assets").insert(toRow(values)).select("*").single();
  if (error) throw toError(error);
  return data;
}

export async function updateAsset(id: string, values: AssetFormValues): Promise<AssetRow> {
  const { data, error } = await db().from("assets").update(toRow(values)).eq("id", id).select("*").single();
  if (error) throw toError(error);
  return data;
}

export async function deleteAsset(asset: AssetRow) {
  const { error } = await db().from("assets").delete().eq("id", asset.id);
  if (error) throw toError(error);
  if (asset.image_path) await db().storage.from(ASSET_IMAGE_BUCKET).remove([asset.image_path]);
}

export async function uploadAssetImage(asset: AssetRow, file: File): Promise<AssetRow> {
  if (!file.type.startsWith("image/")) throw new Error("Only image files are allowed.");
  if (file.size > MAX_ASSET_IMAGE_BYTES) throw new Error("Image must be 5 MB or smaller.");

  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${asset.user_id}/${asset.id}/${Date.now()}.${ext}`;
  const up = await db().storage.from(ASSET_IMAGE_BUCKET).upload(path, file, { contentType: file.type, upsert: false });
  if (up.error) throw new Error(up.error.message);

  const { data, error } = await db().from("assets").update({ image_path: path }).eq("id", asset.id).select("*").single();
  if (error) throw toError(error);
  if (asset.image_path) await db().storage.from(ASSET_IMAGE_BUCKET).remove([asset.image_path]);
  return data;
}

export async function removeAssetImage(asset: AssetRow): Promise<AssetRow> {
  const { data, error } = await db().from("assets").update({ image_path: null }).eq("id", asset.id).select("*").single();
  if (error) throw toError(error);
  if (asset.image_path) await db().storage.from(ASSET_IMAGE_BUCKET).remove([asset.image_path]);
  return data;
}

export async function getSignedImageUrl(path: string): Promise<string | null> {
  const { data, error } = await db().storage.from(ASSET_IMAGE_BUCKET).createSignedUrl(path, 60 * 60);
  if (error) return null;
  return data.signedUrl;
}
