import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CveDetailView } from "@/features/cve/components/cve-detail";
import { isCveId } from "@/utils/validators";

export async function generateMetadata({ params }: PageProps<"/cve/[id]">): Promise<Metadata> {
  const { id } = await params;
  return { title: decodeURIComponent(id).toUpperCase() };
}

export default async function CveDetailPage({ params }: PageProps<"/cve/[id]">) {
  const { id } = await params;
  const cveId = decodeURIComponent(id).toUpperCase();
  if (!isCveId(cveId)) notFound();
  return <CveDetailView id={cveId} />;
}
