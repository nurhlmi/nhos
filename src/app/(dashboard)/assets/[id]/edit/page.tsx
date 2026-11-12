import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { AssetEditLoader } from "@/features/assets/components/asset-edit-loader";
import { isUuid } from "@/utils/validators";

export const metadata: Metadata = { title: "Edit asset" };

export default async function EditAssetPage({ params }: PageProps<"/assets/[id]/edit">) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  return (
    <>
      <PageHeader title="Edit asset" description="Update the purchase details, status or notes." />
      <AssetEditLoader id={id} />
    </>
  );
}
