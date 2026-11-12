import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { WidgetCard } from "@/components/shared/widget-card";
import { CurrencyConverter } from "@/features/currency/components/currency-converter";
import { RateBoard } from "@/features/currency/components/rate-board";
import { RateHistoryChart } from "@/features/currency/components/rate-history-chart";
import { WatchlistManager } from "@/features/currency/components/watchlist-manager";
import { MONITORED_PAIRS } from "@/features/currency/constants";

export const metadata: Metadata = { title: "Currency Exchange" };

export default function CurrencyPage() {
  return (
    <>
      <PageHeader
        title="Currency Exchange"
        description="ECB daily reference rates against the Indonesian Rupiah and other currencies."
      />
      <div className="grid gap-4 xl:grid-cols-5">
        <WidgetCard title="Rate history" className="xl:col-span-3">
          <RateHistoryChart />
        </WidgetCard>
        <WidgetCard title="Converter" className="xl:col-span-2">
          <CurrencyConverter />
        </WidgetCard>
        <WidgetCard title="Rate monitoring" className="xl:col-span-3">
          <RateBoard pairs={MONITORED_PAIRS} />
        </WidgetCard>
        <WidgetCard title="My watchlist" className="xl:col-span-2">
          <WatchlistManager />
        </WidgetCard>
      </div>
    </>
  );
}
