"use client";

import { useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { SourceBadge } from "@/components/shared/source-badge";
import { ChartTooltipBox, axisProps } from "@/components/charts/chart-tooltip";
import { ChangeIndicator } from "@/features/currency/components/change-indicator";
import { useGoldHistory } from "@/features/gold/hooks";
import { formatIdr, formatIdrCompact, formatWeight } from "@/features/gold/format";
import { GOLD_RANGES, type GoldPoint, type GoldRange } from "@/features/gold/types";
import { formatDate } from "@/utils/format";

const RANGE_LABEL: Record<GoldRange, string> = {
  "7D": "last 7 days",
  "1M": "last month",
  "3M": "last 3 months",
  "6M": "last 6 months",
  "1Y": "last 12 months",
};

export function GoldHistoryChart({ type, weight }: { type: string; weight: number | null }) {
  const [range, setRange] = useState<GoldRange>("1M");
  const history = useGoldHistory(type, weight, range);
  const data = history.data?.data;
  const hasValues = data?.points.some((p) => p.sell !== null || p.buyback !== null) ?? false;
  const basisLabel = data?.basis === "buyback" ? "buyback" : "selling";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="min-w-0 flex-1 text-sm font-medium">
          {weight === null
            ? "Select a weight in the price list to chart it."
            : `How did ${type} ${formatWeight(weight)} move over the ${RANGE_LABEL[range]}?`}
        </h3>
        <Tabs value={range} onValueChange={(v) => setRange(v as GoldRange)}>
          <TabsList>
            {GOLD_RANGES.map((r) => (
              <TabsTrigger key={r} value={r} className="px-2.5 text-xs">
                {r}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {weight === null ? null : history.isError ? (
        <ErrorState title="Price history unavailable" error={history.error} onRetry={() => void history.refetch()} />
      ) : !data ? (
        <Skeleton className="h-[300px] w-full" />
      ) : !hasValues ? (
        <EmptyState
          title="No prices recorded in this range"
          description="Galeri 24 listed this weight as out of stock on every day in the range. Try 1Y, or another weight."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric
              label={`Latest ${basisLabel}`}
              value={formatIdr(data.latest)}
              hint={data.latest === null ? "Out of stock today" : data.latestDate ? formatDate(data.latestDate, "dd MMM") : undefined}
            />
            <Metric
              label="Change vs previous day"
              value={<ChangeIndicator value={data.dayChangePercent} className="text-sm" />}
            />
            <Metric
              label={`Change (${range})`}
              value={<ChangeIndicator value={data.periodChangePercent} className="text-sm" />}
            />
            <Metric
              label="Range high / low"
              value={data.high !== null && data.low !== null ? `${formatIdrCompact(data.high)} / ${formatIdrCompact(data.low)}` : "n/a"}
            />
          </div>
          <div className="h-[300px]" role="img" aria-label={`${type} ${weight ? formatWeight(weight) : ""} selling and buyback price history`}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
                <XAxis dataKey="date" {...axisProps} tickFormatter={(d: string) => formatDate(d, "dd MMM")} minTickGap={32} />
                <YAxis {...axisProps} width={72} domain={["auto", "auto"]} tickFormatter={(v: number) => formatIdrCompact(v)} />
                <Tooltip
                  cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "3 3" }}
                  content={({ active, payload }) => {
                    const p = payload?.[0]?.payload as GoldPoint | undefined;
                    if (!active || !p) return null;
                    return (
                      <ChartTooltipBox
                        title={formatDate(p.date, "EEE, dd MMM yyyy")}
                        rows={[
                          { label: "Selling", value: p.sell === null ? "Out of stock" : formatIdr(p.sell), color: "var(--series-1)" },
                          { label: "Buyback", value: formatIdr(p.buyback), color: "var(--series-2)" },
                        ]}
                      />
                    );
                  }}
                />
                <Line type="monotone" dataKey="sell" name="Selling" stroke="var(--series-1)" strokeWidth={2} dot={false} activeDot={{ r: 4, stroke: "var(--card)", strokeWidth: 2 }} isAnimationActive={false} />
                <Line type="monotone" dataKey="buyback" name="Buyback" stroke="var(--series-2)" strokeWidth={2} dot={false} activeDot={{ r: 4, stroke: "var(--card)", strokeWidth: 2 }} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <Legend color="var(--series-1)" label="Selling" />
            <Legend color="var(--series-2)" label="Buyback" />
            <span>Gaps are days the weight was out of stock.</span>
          </div>
        </>
      )}
      <SourceBadge meta={history.data?.meta} />
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-0.5 w-3 rounded-full" style={{ background: color }} aria-hidden />
      {label}
    </span>
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
