import type { AssetCategory, AssetStatus } from "@/types/database";

export const ASSET_CATEGORIES: { value: AssetCategory; label: string }[] = [
  { value: "electronics", label: "Electronics" },
  { value: "vehicle", label: "Vehicle" },
  { value: "property", label: "Property" },
  { value: "furniture", label: "Furniture" },
  { value: "software", label: "Software" },
  { value: "other", label: "Other" },
];

export const ASSET_STATUSES: { value: AssetStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "disposed", label: "Disposed" },
  { value: "sold", label: "Sold" },
  { value: "lost", label: "Lost" },
];

export const categoryLabel = (v: AssetCategory) => ASSET_CATEGORIES.find((c) => c.value === v)?.label ?? v;
export const statusLabel = (v: AssetStatus) => ASSET_STATUSES.find((s) => s.value === v)?.label ?? v;

export const ASSET_IMAGE_BUCKET = "asset-images";
export const MAX_ASSET_IMAGE_BYTES = 5 * 1024 * 1024;
