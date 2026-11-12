"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorState, StatSkeleton } from "@/components/shared/states";
import { cn } from "@/lib/utils";
import { normalizeOrder, useDashboardPreferences, type WidgetId } from "@/features/dashboard/hooks";
import { CustomizeDialog } from "@/features/dashboard/components/customize-dialog";
import {
  AssetsWidget,
  CurrencyWidget,
  CveWidget,
  GoldWidget,
  StocksWidget,
  NewsWidget,
  PrayerWidget,
  HolidaysWidget,
  QuickAccessWidget,
  WelcomeWidget,
} from "@/features/dashboard/components/widgets";

/** Grid span per widget (12-column grid on xl). */
const SPAN: Record<WidgetId, string> = {
  welcome: "xl:col-span-12",
  prayer: "xl:col-span-8",
  holidays: "xl:col-span-4",
  currency: "xl:col-span-4",
  gold: "xl:col-span-4",
  stocks: "xl:col-span-4",
  assets: "xl:col-span-4",
  cve: "xl:col-span-8",
  news: "xl:col-span-12",
  quick_access: "xl:col-span-12",
};

const DEFAULT_LINKS = ["/currency", "/assets", "/cve", "/news", "/cv", "/settings"];

export function Overview() {
  const prefs = useDashboardPreferences();
  const [customizing, setCustomizing] = useState(false);

  const order = normalizeOrder(prefs.data?.widget_order ?? []);
  const hidden = new Set(prefs.data?.hidden_widgets ?? []);
  const links = prefs.data?.quick_links ?? DEFAULT_LINKS;

  const render = (id: WidgetId) => {
    switch (id) {
      case "welcome":
        return <WelcomeWidget />;
      case "prayer":
        return <PrayerWidget />;
      case "holidays":
        return <HolidaysWidget />;
      case "currency":
        return <CurrencyWidget />;
      case "gold":
        return <GoldWidget />;
      case "stocks":
        return <StocksWidget />;
      case "assets":
        return <AssetsWidget />;
      case "cve":
        return <CveWidget />;
      case "news":
        return <NewsWidget />;
      case "quick_access":
        return <QuickAccessWidget links={links} onCustomize={() => setCustomizing(true)} />;
    }
  };

  return (
    <>
      <PageHeader
        title="Overview"
        description="Today's prayer times, your next day off, exchange rates, gold prices, IDX stocks, assets, new vulnerabilities and tech headlines."
        actions={
          <Button variant="outline" onClick={() => setCustomizing(true)} disabled={!prefs.data}>
            <SlidersHorizontal /> Customize
          </Button>
        }
      />
      {prefs.isError ? (
        <ErrorState error={prefs.error} onRetry={() => void prefs.refetch()} />
      ) : prefs.isLoading ? (
        <StatSkeleton />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-12">
          {order
            .filter((id) => !hidden.has(id))
            .map((id) => (
              <div key={id} className={cn("min-w-0 *:h-full", id === "welcome" || id === "prayer" || id === "quick_access" ? "md:col-span-2" : "", SPAN[id])}>
                {render(id)}
              </div>
            ))}
        </div>
      )}
      {prefs.data && <CustomizeDialog prefs={prefs.data} open={customizing} onOpenChange={setCustomizing} />}
    </>
  );
}
