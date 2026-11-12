import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { ApiMonitorView } from "@/features/api-monitor/components/api-monitor-view";

export const metadata: Metadata = { title: "API Monitoring" };

export default function MonitoringPage() {
  return (
    <>
      <PageHeader
        title="API Monitoring"
        description="Every external API this system calls, with its live status and whether it needs an API key."
      />
      <ApiMonitorView />
    </>
  );
}
