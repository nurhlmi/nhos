import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { CvBuilder } from "@/features/cv/components/cv-builder";

export const metadata: Metadata = { title: "CV Builder" };

export default function CvPage() {
  return (
    <>
      <PageHeader
        title="CV Builder"
        description="Maintain your professional profile once, then produce multiple CV versions with different templates."
      />
      <CvBuilder />
    </>
  );
}
