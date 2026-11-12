import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { PrayerView } from "@/features/prayer/components/prayer-view";

export const metadata: Metadata = { title: "Prayer Times" };

export default function PrayerPage() {
  return (
    <>
      <PageHeader
        title="Prayer Times"
        description="Daily and monthly jadwal sholat from Kemenag RI, for any regency or city in Indonesia."
      />
      <PrayerView />
    </>
  );
}
