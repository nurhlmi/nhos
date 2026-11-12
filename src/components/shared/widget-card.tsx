import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Compact dashboard card with title, optional View All link and footer. */
export function WidgetCard({
  title,
  icon: Icon,
  href,
  hrefLabel = "View all",
  actions,
  footer,
  children,
  className,
  bodyClassName,
}: {
  title: string;
  icon?: LucideIcon;
  href?: string;
  hrefLabel?: string;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("flex flex-col rounded-xl border bg-card", className)}>
      <header className="flex h-12 items-center justify-between gap-2 border-b px-4">
        <div className="flex min-w-0 items-center gap-2">
          {Icon && <Icon className="size-4 shrink-0 text-muted-foreground" />}
          <h2 className="truncate text-sm font-medium">{title}</h2>
        </div>
        <div className="flex items-center gap-1">
          {actions}
          {href && (
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
              <Link href={href}>
                {hrefLabel}
              </Link>
            </Button>
          )}
        </div>
      </header>
      <div className={cn("flex-1 p-4", bodyClassName)}>{children}</div>
      {footer && <footer className="border-t px-4 py-2.5">{footer}</footer>}
    </section>
  );
}
