import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { HolidaysView } from "@/features/holidays/components/holidays-view";

export const metadata: Metadata = { title: "Public Holidays" };

export default function HolidaysPage() {
  return (
    <>
      <PageHeader
        title="Public Holidays"
        description="Indonesian tanggal merah and cuti bersama for the year, with your next day off."
      />
      <HolidaysView />
    </>
  );
}
