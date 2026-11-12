import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { CveWatchlist } from "@/features/cve/components/cve-watchlist";

export const metadata: Metadata = { title: "CVE Watchlist" };

export default function CveWatchlistPage() {
  return (
    <>
      <PageHeader title="CVE Watchlist" description="CVEs you are tracking, with review status and personal notes." />
      <CveWatchlist />
    </>
  );
}
