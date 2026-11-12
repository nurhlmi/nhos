"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartTooltipBox, axisProps } from "@/components/charts/chart-tooltip";
import { EmptyState } from "@/components/shared/states";
import { formatCompact, formatCurrency } from "@/utils/format";
import type { AssetRow } from "@/types/database";
import { ASSET_CATEGORIES } from "@/features/assets/constants";
import { isHeld } from "@/features/assets/hooks";

/** Acquisition cost of held assets by category (one hue; category named on the axis). */
export function CategoryDistributionChart({ assets }: { assets: AssetRow[] }) {
  const data = useMemo(() => {
    const held = assets.filter(isHeld);
    return ASSET_CATEGORIES.map((c) => {
      const items = held.filter((a) => a.category === c.value);
      return {
        category: c.label,
        count: items.length,
        cost: items.reduce((s, a) => s + Number(a.purchase_price), 0),
      };
    })
      .filter((d) => d.count > 0)
      .sort((a, b) => b.cost - a.cost);
  }, [assets]);

  if (data.length === 0) return <EmptyState title="No held assets to chart" description="Only active and inactive assets count. Add an asset or change a status." compact />;

  return (
    <div style={{ height: Math.max(140, data.length * 40 + 30) }} role="img" aria-label="Acquisition cost by category">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }} barCategoryGap={8}>
          <CartesianGrid horizontal={false} stroke="var(--chart-grid)" />
          <XAxis type="number" {...axisProps} tickFormatter={(v: number) => formatCompact(v)} />
          <YAxis type="category" dataKey="category" {...axisProps} width={84} />
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.4 }}
            content={({ active, payload }) => {
              const p = payload?.[0]?.payload as (typeof data)[number] | undefined;
              if (!active || !p) return null;
              return (
                <ChartTooltipBox
                  title={p.category}
                  rows={[
                    { label: "Acquisition cost", value: formatCurrency(p.cost), color: "var(--series-1)" },
                    { label: "Assets", value: String(p.count) },
                  ]}
                />
              );
            }}
          />
          <Bar dataKey="cost" fill="var(--series-1)" radius={[0, 4, 4, 0]} maxBarSize={22} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
