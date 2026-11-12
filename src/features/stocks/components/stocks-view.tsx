"use client";

import { useState } from "react";
import { WidgetCard } from "@/components/shared/widget-card";
import { COMPOSITE, WATCHLIST } from "@/features/stocks/constants";
import { IndexSummary } from "@/features/stocks/components/index-summary";
import { QuoteBoard } from "@/features/stocks/components/quote-board";
import { StockHistoryChart } from "@/features/stocks/components/stock-history-chart";

export function StocksView() {
  const [code, setCode] = useState(COMPOSITE);

  return (
    <div className="grid gap-4 xl:grid-cols-5">
      <WidgetCard title="Price history" className="xl:col-span-3">
        <StockHistoryChart code={code} options={[COMPOSITE, ...WATCHLIST]} onCodeChange={setCode} />
      </WidgetCard>
      <WidgetCard title="IHSG today" className="xl:col-span-2">
        <IndexSummary />
      </WidgetCard>
      <WidgetCard title="Watchlist" className="xl:col-span-5">
        <QuoteBoard codes={WATCHLIST} selected={code} onSelect={setCode} />
      </WidgetCard>
    </div>
  );
}
