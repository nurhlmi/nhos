"use client";

import { useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ErrorState, EmptyState } from "@/components/shared/states";
import { SourceBadge } from "@/components/shared/source-badge";
import { ChartTooltipBox, axisProps } from "@/components/charts/chart-tooltip";
import { ChangeIndicator } from "@/features/currency/components/change-indicator";
import { CurrencySelect } from "@/features/currency/components/currency-select";
import { usePairHistory } from "@/features/currency/hooks";
import { HISTORY_RANGES, type HistoryRange } from "@/features/currency/types";
import { formatDate, formatRate } from "@/utils/format";

const RANGE_LABEL: Record<HistoryRange, string> = {
  "1D": "last two daily fixings",
  "7D": "last 7 days",
  "1M": "last month",
  "3M": "last 3 months",
  "6M": "last 6 months",
  "1Y": "last 12 months",
};

export function RateHistoryChart({ initialBase = "USD", initialQuote = "IDR" }: { initialBase?: string; initialQuote?: string }) {
  const [base, setBase] = useState(initialBase);
  const [quote, setQuote] = useState(initialQuote);
  const [range, setRange] = useState<HistoryRange>("1M");
  const history = usePairHistory(base, quote, range);
  const data = history.data?.data;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">
        How did {base}/{quote} move over the {RANGE_LABEL[range]}?
      </h3>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5">
          <CurrencySelect value={base} onChange={setBase} exclude={quote} className="w-24" aria-label="Base currency" />
          <span className="text-muted-foreground">/</span>
          <CurrencySelect value={quote} onChange={setQuote} exclude={base} className="w-24" aria-label="Quote currency" />
        </div>
        <Tabs value={range} onValueChange={(v) => setRange(v as HistoryRange)} className="ml-auto">
          <TabsList>
            {HISTORY_RANGES.map((r) => (
              <TabsTrigger key={r} value={r} className="px-2.5 text-xs">
                {r}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {history.isError ? (
        <ErrorState error={history.error} onRetry={() => void history.refetch()} />
      ) : !data ? (
        <Skeleton className="h-[260px] w-full" />
      ) : data.points.length === 0 ? (
        <EmptyState title="No historical data" description="The source has no fixings for this pair in the selected range." />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric label="Latest" value={formatRate(data.points.at(-1)!.rate)} />
            <Metric label={`Change (${range})`} value={<ChangeIndicator value={data.periodChangePercent} className="text-sm" />} />
            <Metric label="Period high" value={data.high !== null ? formatRate(data.high) : "n/a"} />
            <Metric label="Period low" value={data.low !== null ? formatRate(data.low) : "n/a"} />
          </div>
          <div className="h-[260px]" aria-label={`${base}/${quote} rate history chart`} role="img">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="fxFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--series-1)" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="var(--series-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
                <XAxis dataKey="date" {...axisProps} tickFormatter={(d: string) => formatDate(d, "dd MMM")} minTickGap={32} />
                <YAxis {...axisProps} width={64} domain={["auto", "auto"]} tickFormatter={(v: number) => formatRate(v)} />
                <Tooltip
                  cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "3 3" }}
                  content={({ active, payload }) => {
                    const p = payload?.[0]?.payload as { date: string; rate: number } | undefined;
                    if (!active || !p) return null;
                    return (
                      <ChartTooltipBox
                        title={formatDate(p.date, "EEE, dd MMM yyyy")}
                        rows={[{ label: `${base}/${quote}`, value: formatRate(p.rate), color: "var(--series-1)" }]}
                      />
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="rate"
                  stroke="var(--series-1)"
                  strokeWidth={2}
                  fill="url(#fxFill)"
                  dot={data.points.length <= 10 ? { r: 3, fill: "var(--series-1)", strokeWidth: 0 } : false}
                  activeDot={{ r: 4, stroke: "var(--card)", strokeWidth: 2 }}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
      <SourceBadge meta={history.data?.meta} />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-surface-2 px-3 py-2">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <div className="tabular mt-0.5 text-sm font-semibold">{value}</div>
    </div>
  );
}
