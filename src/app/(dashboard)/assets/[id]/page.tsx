import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AssetDetail } from "@/features/assets/components/asset-detail";
import { isUuid } from "@/utils/validators";

export const metadata: Metadata = { title: "Asset detail" };

export default async function AssetDetailPage({ params }: PageProps<"/assets/[id]">) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  return <AssetDetail id={id} />;
}
