"use client";

import { ArrowDown, ArrowUp, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { CvProfileRow, CvTemplate } from "@/types/database";
import { cn } from "@/lib/utils";
import { useCvProfileMutations } from "@/features/cv/hooks";
import { SECTION_LABELS, TEMPLATES, orderedSections, type CvSection } from "@/features/cv/types";

export function LayoutEditor({ profile }: { profile: CvProfileRow }) {
  const { update } = useCvProfileMutations();
  const order = orderedSections(profile);
  const hidden = new Set(profile.hidden_sections);

  const setTemplate = (template: CvTemplate) => update.mutate({ id: profile.id, values: { template } });
  const move = (index: number, dir: -1 | 1) => {
    const next = [...order];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target]!, next[index]!];
    update.mutate({ id: profile.id, values: { section_order: next } });
  };
  const toggle = (section: CvSection, visible: boolean) => {
    const next = visible ? profile.hidden_sections.filter((s) => s !== section) : [...new Set([...profile.hidden_sections, section])];
    update.mutate({ id: profile.id, values: { hidden_sections: next } });
  };

  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-2 text-sm font-medium">Template</h3>
        <div className="grid gap-2 sm:grid-cols-3">
          {TEMPLATES.map((t) => {
            const active = profile.template === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setTemplate(t.value)}
                aria-pressed={active}
                className={cn(
                  "relative rounded-lg border p-3 text-left transition-colors",
                  active ? "border-primary bg-primary/5" : "hover:border-primary/40",
                )}
              >
                {active && <Check className="absolute top-2.5 right-2.5 size-4 text-primary" />}
                <p className="text-sm font-medium">{t.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t.description}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-medium">Sections</h3>
        <p className="mb-3 text-xs text-muted-foreground">Reorder or hide sections for this CV version. Empty sections are skipped automatically.</p>
        <ul className="divide-y rounded-lg border">
          {order.map((s, i) => (
            <li key={s} className="flex items-center gap-2 px-3 py-2">
              <div className="flex">
                <Button variant="ghost" size="icon-xs" aria-label={`Move ${SECTION_LABELS[s]} up`} disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp /></Button>
                <Button variant="ghost" size="icon-xs" aria-label={`Move ${SECTION_LABELS[s]} down`} disabled={i === order.length - 1} onClick={() => move(i, 1)}><ArrowDown /></Button>
              </div>
              <span className={cn("flex-1 text-sm", hidden.has(s) && "text-muted-foreground line-through")}>{SECTION_LABELS[s]}</span>
              <Switch checked={!hidden.has(s)} onCheckedChange={(v) => toggle(s, v)} aria-label={`Show ${SECTION_LABELS[s]}`} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
