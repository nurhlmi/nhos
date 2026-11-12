"use client";

import { ErrorState } from "@/components/shared/states";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState title="This page failed to load" error={error} onRetry={reset} />;
}
