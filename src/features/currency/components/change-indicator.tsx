import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPercent } from "@/utils/format";

export function ChangeIndicator({ value, className }: { value: number | null; className?: string }) {
  if (value === null || !Number.isFinite(value)) {
    return <span className={cn("text-xs text-muted-foreground", className)}>n/a</span>;
  }
  const flat = Math.abs(value) < 0.005;
  const Icon = flat ? Minus : value > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "tabular inline-flex items-center gap-0.5 text-xs font-medium",
        flat ? "text-muted-foreground" : value > 0 ? "text-success" : "text-destructive",
        className,
      )}
    >
      <Icon className="size-3.5" />
      {formatPercent(value)}
    </span>
  );
}
