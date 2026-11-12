import { Flame, OctagonAlert, TriangleAlert, Info, CircleDashed, CircleMinus } from "lucide-react";
import type { SeverityOrUnscored } from "@/features/cve/types";
import { cn } from "@/lib/utils";

const config: Record<SeverityOrUnscored, { label: string; className: string; icon: typeof Flame }> = {
  CRITICAL: { label: "Critical", className: "border-destructive/40 bg-destructive/15 text-destructive", icon: OctagonAlert },
  HIGH: { label: "High", className: "border-orange-500/35 bg-orange-500/10 text-orange-700 dark:text-orange-400", icon: TriangleAlert },
  MEDIUM: { label: "Medium", className: "border-warning/35 bg-warning/10 text-warning", icon: TriangleAlert },
  LOW: { label: "Low", className: "border-primary/30 bg-primary/10 text-primary", icon: Info },
  NONE: { label: "None", className: "border-border bg-muted text-muted-foreground", icon: CircleMinus },
  UNSCORED: { label: "Unscored", className: "border-dashed border-border text-muted-foreground", icon: CircleDashed },
};

/** Severity is always icon + label + color, never color alone. */
export function SeverityBadge({ severity, score, className }: { severity: SeverityOrUnscored; score?: number | null; className?: string }) {
  const c = config[severity];
  const Icon = c.icon;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap",
        c.className,
        className,
      )}
    >
      <Icon className="size-3" aria-hidden />
      {c.label}
      {score !== undefined && score !== null && <span className="tabular opacity-90">{score.toFixed(1)}</span>}
    </span>
  );
}

export function KevBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-md border border-destructive/40 bg-destructive/10 px-1.5 py-0.5 text-[11px] font-medium text-destructive",
        className,
      )}
      title="Listed in CISA Known Exploited Vulnerabilities"
    >
      <Flame className="size-3" aria-hidden /> KEV
    </span>
  );
}
