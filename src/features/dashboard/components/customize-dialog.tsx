"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { allNav } from "@/config/navigation";
import type { DashboardPreferencesRow } from "@/types/database";
import { WIDGET_LABELS, normalizeOrder, useUpdateDashboardPreferences } from "@/features/dashboard/hooks";

export function CustomizeDialog({
  prefs,
  open,
  onOpenChange,
}: {
  prefs: DashboardPreferencesRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const update = useUpdateDashboardPreferences();
  const order = normalizeOrder(prefs.widget_order);
  const hidden = new Set(prefs.hidden_widgets);

  const move = (i: number, dir: -1 | 1) => {
    const next = [...order];
    const t = i + dir;
    if (t < 0 || t >= next.length) return;
    [next[i], next[t]] = [next[t]!, next[i]!];
    update.mutate({ user_id: prefs.user_id, widget_order: next });
  };
  const toggleWidget = (id: string, visible: boolean) =>
    update.mutate({
      user_id: prefs.user_id,
      hidden_widgets: visible ? prefs.hidden_widgets.filter((w) => w !== id) : [...new Set([...prefs.hidden_widgets, id])],
    });
  const toggleLink = (href: string, on: boolean) => {
    const next = on ? [...prefs.quick_links, href] : prefs.quick_links.filter((l) => l !== href);
    // Keep navigation order stable.
    update.mutate({ user_id: prefs.user_id, quick_links: allNav.map((n) => n.href).filter((h) => next.includes(h)) });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Customize overview</DialogTitle>
          <DialogDescription>Reorder and hide widgets, and pick quick-access shortcuts. Saved to your account.</DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          <section>
            <h3 className="mb-2 text-sm font-medium">Widgets</h3>
            <ul className="divide-y rounded-lg border">
              {order.map((id, i) => (
                <li key={id} className="flex items-center gap-2 px-3 py-2">
                  <div className="flex">
                    <Button variant="ghost" size="icon-xs" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move ${WIDGET_LABELS[id]} up`}><ArrowUp /></Button>
                    <Button variant="ghost" size="icon-xs" disabled={i === order.length - 1} onClick={() => move(i, 1)} aria-label={`Move ${WIDGET_LABELS[id]} down`}><ArrowDown /></Button>
                  </div>
                  <span className="flex-1 text-sm">{WIDGET_LABELS[id]}</span>
                  <Switch checked={!hidden.has(id)} onCheckedChange={(v) => toggleWidget(id, v)} aria-label={`Show ${WIDGET_LABELS[id]}`} />
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h3 className="mb-2 text-sm font-medium">Quick access shortcuts</h3>
            <div className="grid grid-cols-2 gap-2">
              {allNav.filter((n) => n.href !== "/").map((n) => (
                <div key={n.href} className="flex items-center gap-2">
                  <Checkbox id={`ql-${n.href}`} checked={prefs.quick_links.includes(n.href)} onCheckedChange={(c) => toggleLink(n.href, c === true)} />
                  <Label htmlFor={`ql-${n.href}`} className="font-normal">{n.title}</Label>
                </div>
              ))}
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
