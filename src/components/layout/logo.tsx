import { APP_NAME, APP_SHORT_NAME } from "@/lib/env";
import { cn } from "@/lib/utils";

/**
 * Text wordmark only. No logo mark has been designed or approved by the owner
 * yet (antislop R-23), so the product name stands in for it.
 */
export function Logo({ collapsed = false, className }: { collapsed?: boolean; className?: string }) {
  if (collapsed) {
    return (
      <span className={cn("text-sm font-semibold tracking-tight", className)} aria-label={APP_NAME}>
        {APP_SHORT_NAME}
      </span>
    );
  }
  return (
    <div className={cn("flex flex-col leading-none", className)}>
      <span className="text-base font-semibold tracking-tight">{APP_NAME}</span>
      <span className="mt-1 text-[11px] text-muted-foreground">Command Center</span>
    </div>
  );
}
