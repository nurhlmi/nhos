import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { StocksView } from "@/features/stocks/components/stocks-view";

export const metadata: Metadata = { title: "Indonesian Stocks" };

export default function StocksPage() {
  return (
    <>
      <PageHeader
        title="Indonesian Stocks"
        description="IHSG and a watchlist of IDX stocks, from Yahoo Finance."
      />
      <StocksView />
    </>
  );
}
