"use client";

type TooltipRow = { label: string; value: string; color?: string };

/** Shared tooltip body for Recharts charts: text in text tokens, color only on the swatch. */
export function ChartTooltipBox({ title, rows }: { title: string; rows: TooltipRow[] }) {
  return (
    <div className="rounded-md border bg-popover px-2.5 py-2 text-xs shadow-md">
      <p className="mb-1 font-medium text-popover-foreground">{title}</p>
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-2 text-muted-foreground">
          {r.color && <span className="size-2 rounded-full" style={{ background: r.color }} aria-hidden />}
          <span>{r.label}</span>
          <span className="tabular ml-auto pl-3 font-medium text-popover-foreground">{r.value}</span>
        </div>
      ))}
    </div>
  );
}

export const axisProps = {
  stroke: "var(--muted-foreground)",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const;
