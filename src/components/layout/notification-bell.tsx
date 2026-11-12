"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format, subDays } from "date-fns";
import { Bell, Flame, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCveBookmarks, useKev } from "@/features/cve/hooks";
import { formatDate } from "@/utils/format";

const SEEN_KEY = "nhos:notifications-seen";

/**
 * Real signals only: CISA KEV entries added since you last opened this panel,
 * and watchlisted CVEs you have not reviewed yet.
 */
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [seenAt, setSeenAt] = useState<string>(() => format(subDays(new Date(), 7), "yyyy-MM-dd"));
  const kev = useKev({ page: 1, pageSize: 10 });
  const bookmarks = useCveBookmarks();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SEEN_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- read persisted value after mount
      if (stored) setSeenAt(stored);
    } catch {
      // storage unavailable
    }
  }, []);

  const newKev = (kev.data?.data.items ?? []).filter((e) => e.dateAdded > seenAt);
  const pending = (bookmarks.data ?? []).filter((b) => !b.is_reviewed);
  const count = newKev.length + pending.length;

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next && newKev.length) {
      const today = format(new Date(), "yyyy-MM-dd");
      setSeenAt(today);
      try {
        localStorage.setItem(SEEN_KEY, today);
      } catch {
        // storage unavailable
      }
    }
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={`Notifications${count ? ` (${count})` : ""}`}>
          <Bell />
          {count > 0 && (
            <span className="tabular absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white dark:text-[#0a0e16]">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b px-4 py-3">
          <p className="text-sm font-medium">Notifications</p>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {kev.isError && <p className="px-4 py-3 text-xs text-muted-foreground">KEV feed unavailable right now.</p>}
          {newKev.length > 0 && (
            <Section title="New in CISA KEV">
              {newKev.slice(0, 5).map((e) => (
                <Item key={e.cveID} href={`/cve/${e.cveID}`} icon={<Flame className="size-3.5 text-destructive" />} onClick={() => onOpenChange(false)}>
                  <span className="font-mono text-xs font-medium">{e.cveID}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {e.vendorProject} {e.product} · added {formatDate(e.dateAdded)}
                  </span>
                </Item>
              ))}
            </Section>
          )}
          {pending.length > 0 && (
            <Section title="Watchlist to review">
              {pending.slice(0, 5).map((b) => (
                <Item key={b.id} href={`/cve/${b.cve_id}`} icon={<Bookmark className="size-3.5 text-primary" />} onClick={() => onOpenChange(false)}>
                  <span className="font-mono text-xs font-medium">{b.cve_id}</span>
                  <span className="block truncate text-xs text-muted-foreground">{b.description}</span>
                </Item>
              ))}
              {pending.length > 5 && (
                <Link href="/cve/watchlist" onClick={() => onOpenChange(false)} className="block px-4 py-2 text-xs text-primary hover:underline">
                  View all {pending.length}
                </Link>
              )}
            </Section>
          )}
          {count === 0 && !kev.isLoading && <p className="px-4 py-6 text-center text-xs text-muted-foreground">You&apos;re all caught up.</p>}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="py-1">
      <p className="px-4 pt-2 pb-1 text-xs font-medium text-muted-foreground">{title}</p>
      {children}
    </div>
  );
}

function Item({ href, icon, children, onClick }: { href: string; icon: React.ReactNode; children: React.ReactNode; onClick: () => void }) {
  return (
    <Link href={href} onClick={onClick} className="flex items-start gap-2.5 px-4 py-2 hover:bg-muted/60">
      <span className="mt-0.5">{icon}</span>
      <span className="min-w-0 flex-1">{children}</span>
    </Link>
  );
}
