"use client";

import { useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { SourceBadge } from "@/components/shared/source-badge";
import { ChartTooltipBox, axisProps } from "@/components/charts/chart-tooltip";
import { ChangeIndicator } from "@/features/currency/components/change-indicator";
import { COMPOSITE } from "@/features/stocks/constants";
import { useStockHistory } from "@/features/stocks/hooks";
import { formatIndex, formatPrice } from "@/features/stocks/format";
import { STOCK_RANGES, type Candle, type StockRange } from "@/features/stocks/types";
import { formatCompact, formatDate } from "@/utils/format";

const RANGE_LABEL: Record<StockRange, string> = {
  "1M": "last month",
  "3M": "last 3 months",
  "6M": "last 6 months",
  "1Y": "last 12 months",
  "2Y": "last 2 years",
};

export const codeLabel = (code: string) => (code === COMPOSITE ? "IHSG" : code);

export function StockHistoryChart({
  code,
  options,
  onCodeChange,
}: {
  code: string;
  /** Codes offered in the picker; the selected one is always included. */
  options: string[];
  onCodeChange: (code: string) => void;
}) {
  const [range, setRange] = useState<StockRange>("3M");
  const history = useStockHistory(code, range);
  const data = history.data?.data;
  const isIndex = code === COMPOSITE;
  const fmt = isIndex ? formatIndex : formatPrice;
  const choices = options.includes(code) ? options : [...options, code];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={code} onValueChange={onCodeChange}>
          <SelectTrigger aria-label="Stock or index to chart" className="w-32">
            <SelectValue>
              <span className="font-mono text-xs font-medium">{codeLabel(code)}</span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {choices.map((c) => (
              <SelectItem key={c} value={c}>
                <span className="font-mono text-xs font-medium">{codeLabel(c)}</span>
                {c === COMPOSITE && <span className="text-muted-foreground">Composite index</span>}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <h3 className="min-w-0 flex-1 text-sm font-medium">
          How did {codeLabel(code)} close over the {RANGE_LABEL[range]}?
        </h3>
        <Tabs value={range} onValueChange={(v) => setRange(v as StockRange)}>
          <TabsList>
            {STOCK_RANGES.map((r) => (
              <TabsTrigger key={r} value={r} className="px-2.5 text-xs">
                {r}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {history.isError ? (
        <ErrorState title="Price history unavailable" error={history.error} onRetry={() => void history.refetch()} />
      ) : !data ? (
        <Skeleton className="h-[300px] w-full" />
      ) : data.points.length === 0 ? (
        <EmptyState
          title={`No trading days for ${codeLabel(code)} in this range`}
          description="Yahoo Finance returned no trading days. The stock may be suspended or newly listed. Try a longer range."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric label="Latest close" value={fmt(data.latest)} hint={data.latestDate ? formatDate(data.latestDate, "dd MMM") : undefined} />
            <Metric label="Change vs previous day" value={<ChangeIndicator value={data.dayChangePercent} className="text-sm" />} />
            <Metric label={`Change (${range})`} value={<ChangeIndicator value={data.periodChangePercent} className="text-sm" />} />
            <Metric label="Range high / low" value={`${fmt(data.high)} / ${fmt(data.low)}`} />
          </div>
          <div className="h-[300px]" role="img" aria-label={`${codeLabel(code)} daily close, ${RANGE_LABEL[range]}`}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
                <XAxis dataKey="date" {...axisProps} tickFormatter={(d: string) => formatDate(d, "dd MMM")} minTickGap={32} />
                <YAxis {...axisProps} width={60} domain={["auto", "auto"]} tickFormatter={(v: number) => formatCompact(v)} />
                <Tooltip
                  cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "3 3" }}
                  content={({ active, payload }) => {
                    const p = payload?.[0]?.payload as Candle | undefined;
                    if (!active || !p) return null;
                    return (
                      <ChartTooltipBox
                        title={formatDate(p.date, "EEE, dd MMM yyyy")}
                        rows={[
                          { label: "Close", value: fmt(p.close), color: "var(--series-1)" },
                          { label: "High", value: fmt(p.high) },
                          { label: "Low", value: fmt(p.low) },
                          { label: "Volume", value: p.volume === null ? "n/a" : formatCompact(p.volume) },
                        ]}
                      />
                    );
                  }}
                />
                <Line type="monotone" dataKey="close" name="Close" stroke="var(--series-1)" strokeWidth={2} dot={false} activeDot={{ r: 4, stroke: "var(--card)", strokeWidth: 2 }} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
      <SourceBadge meta={history.data?.meta} />
    </div>
  );
}

function Metric({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="min-w-0 rounded-lg bg-surface-2 px-3 py-2">
      <p className="truncate text-[11px] text-muted-foreground">{label}</p>
      <div className="tabular mt-0.5 truncate text-sm font-semibold">{value}</div>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
