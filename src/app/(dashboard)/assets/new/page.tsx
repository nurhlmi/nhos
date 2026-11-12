import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { AssetForm } from "@/features/assets/components/asset-form";

export const metadata: Metadata = { title: "New asset" };

export default function NewAssetPage() {
  return (
    <>
      <PageHeader title="New asset" description="Record what you bought, when, and for how much." />
      <AssetForm />
    </>
  );
}
