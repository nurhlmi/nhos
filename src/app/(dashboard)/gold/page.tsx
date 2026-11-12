import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { GoldView } from "@/features/gold/components/gold-view";

export const metadata: Metadata = { title: "Gold Prices" };

export default function GoldPage() {
  return (
    <>
      <PageHeader
        title="Gold Prices"
        description="Galeri 24 daily selling and buyback prices for gold bars, in Rupiah."
      />
      <GoldView />
    </>
  );
}
