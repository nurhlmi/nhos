import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { ListSkeleton, StatSkeleton } from "@/components/shared/states";
import { AssetsDashboard } from "@/features/assets/components/assets-dashboard";

export const metadata: Metadata = { title: "Asset Management" };

export default function AssetsPage() {
  return (
    <>
      <PageHeader
        title="Asset Management"
        description="Personal assets with their purchase details, status and photos."
        actions={
          <Button asChild>
            <Link href="/assets/new"><Plus /> Add asset</Link>
          </Button>
        }
      />
      {/* AssetList reads the sort from useSearchParams, which needs a Suspense boundary when the page is prerendered. */}
      <Suspense
        fallback={
          <div className="space-y-4">
            <StatSkeleton />
            <ListSkeleton rows={6} />
          </div>
        }
      >
        <AssetsDashboard />
      </Suspense>
    </>
  );
}
