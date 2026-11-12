import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { isUuid } from "@/utils/validators";
import { loadCvData } from "@/features/cv/server";
import { CvDocument } from "@/features/cv/templates/cv-document";
import { PrintToolbar } from "@/features/cv/components/print-toolbar";

export async function generateMetadata({ params }: PageProps<"/cv/print/[id]">): Promise<Metadata> {
  const { id } = await params;
  if (!isUuid(id)) return { title: "CV" };
  const data = await loadCvData(id);
  // The document title becomes the default PDF file name.
  return { title: { absolute: data ? `${data.profile.full_name || "CV"} - ${data.profile.version_name}` : "CV" } };
}

export default async function CvPrintPage({ params, searchParams }: PageProps<"/cv/print/[id]">) {
  await requireUser();
  const { id } = await params;
  const { print } = await searchParams;
  if (!isUuid(id)) notFound();
  const data = await loadCvData(id);
  if (!data) notFound();

  return (
    <div className="min-h-svh bg-neutral-200 py-8 print:bg-white print:py-0">
      <PrintToolbar autoPrint={print === "1"} />
      <div className="mx-auto w-fit shadow-xl print:shadow-none">
        <CvDocument data={data} />
      </div>
    </div>
  );
}
