import type { Metadata } from "next";
import Link from "next/link";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { CveTabs } from "@/features/cve/components/cve-tabs";

export const metadata: Metadata = { title: "CVE Monitoring" };

export default async function CvePage({ searchParams }: PageProps<"/cve">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.slice(0, 100) : undefined;
  const tab = params.tab === "kev" ? "kev" : "latest";
  return (
    <>
      <PageHeader
        title="CVE Monitoring"
        description="Latest vulnerabilities from NIST NVD, flagged against the CISA Known Exploited Vulnerabilities catalog."
        actions={
          <Button asChild variant="outline">
            <Link href="/cve/watchlist"><Bookmark /> Watchlist</Link>
          </Button>
        }
      />
      <CveTabs initialQuery={q} initialTab={tab} />
    </>
  );
}
