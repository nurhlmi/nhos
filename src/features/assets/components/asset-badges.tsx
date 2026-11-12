import { Badge } from "@/components/ui/badge";
import type { AssetStatus } from "@/types/database";
import { statusLabel } from "@/features/assets/constants";
import { cn } from "@/lib/utils";

const statusTone: Record<AssetStatus, string> = {
  active: "border-success/30 bg-success/10 text-success",
  inactive: "border-border bg-muted text-muted-foreground",
  disposed: "border-border bg-muted text-muted-foreground",
  sold: "border-primary/30 bg-primary/10 text-primary",
  lost: "border-destructive/30 bg-destructive/10 text-destructive",
};

export function AssetStatusBadge({ status }: { status: AssetStatus }) {
  return (
    <Badge variant="outline" className={cn("font-normal", statusTone[status])}>
      {statusLabel(status)}
    </Badge>
  );
}
