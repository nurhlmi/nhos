"use client";

import { APP_NAME } from "@/lib/env";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTheme } from "next-themes";
import { Loader2, Monitor, Moon, Sun, SlidersHorizontal, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WidgetCard } from "@/components/shared/widget-card";
import { useShellUser } from "@/components/layout/user-context";
import { cn } from "@/lib/utils";
import { useMounted } from "@/hooks/use-mounted";
import { FormField } from "@/features/cv/components/form-dialog";
import { updateProfile } from "@/features/settings/actions";
import { profileSchema, type ProfileValues } from "@/features/settings/schemas";
import { useDashboardPreferences } from "@/features/dashboard/hooks";
import { CustomizeDialog } from "@/features/dashboard/components/customize-dialog";

const SOURCES = [
  { name: "European Central Bank via Frankfurter", use: "Exchange rates (daily reference)", url: "https://frankfurter.dev" },
  { name: "NIST National Vulnerability Database", use: "CVE feed, search and detail", url: "https://nvd.nist.gov/developers/vulnerabilities" },
  { name: "CISA KEV Catalog", use: "Known exploited vulnerabilities", url: "https://www.cisa.gov/known-exploited-vulnerabilities-catalog" },
  { name: "Publisher RSS/Atom feeds", use: "Technology news", url: "/news#sources" },
];

export function SettingsView() {
  const user = useShellUser();
  const router = useRouter();
  const { theme: rawTheme, setTheme } = useTheme();
  const mounted = useMounted();
  const theme = mounted ? rawTheme : undefined;
  const prefs = useDashboardPreferences();
  const [customizing, setCustomizing] = useState(false);
  const [pending, startTransition] = useTransition();

  const timezones = useMemo(() => {
    try {
      return Intl.supportedValuesOf("timeZone");
    } catch {
      return [user.timezone];
    }
  }, [user.timezone]);

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: user.fullName ?? "", professional_title: user.professionalTitle ?? "", timezone: user.timezone },
  });
  const { errors, isDirty } = form.formState;

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      const res = await updateProfile(values);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Profile updated");
      form.reset(values);
      router.refresh();
    }),
  );

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <WidgetCard title="Profile">
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="s_full_name" label="Full name" error={errors.full_name}><Input id="s_full_name" {...form.register("full_name")} /></FormField>
            <FormField id="s_title" label="Professional title" error={errors.professional_title}><Input id="s_title" {...form.register("professional_title")} /></FormField>
            <FormField id="s_email" label="Email (sign-in)"><Input id="s_email" value={user.email} disabled readOnly /></FormField>
            <FormField id="s_tz" label="Time zone" error={errors.timezone}>
              <Controller
                control={form.control}
                name="timezone"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="s_tz" className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent className="max-h-72">
                      {timezones.map((tz) => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={pending || !isDirty}>
              {pending && <Loader2 className="animate-spin" />} Save profile
            </Button>
          </div>
        </form>
      </WidgetCard>

      <WidgetCard title="Appearance">
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: "dark", label: "Dark", icon: Moon },
            { value: "light", label: "Light", icon: Sun },
            { value: "system", label: "System", icon: Monitor },
          ].map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTheme(t.value)}
              aria-pressed={theme === t.value}
              className={cn(
                "flex flex-col items-center gap-2 rounded-lg border p-4 text-sm transition-colors",
                theme === t.value ? "border-primary bg-primary/5 font-medium" : "hover:border-primary/40",
              )}
            >
              <t.icon className="size-4" /> {t.label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Dark is the default. System follows the light or dark setting of your device. Theme is stored in this browser.</p>
      </WidgetCard>

      <WidgetCard title="Dashboard" className="scroll-mt-20" >
        <div id="dashboard" className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">Reorder or hide overview widgets and choose quick-access shortcuts.</p>
          <Button variant="outline" onClick={() => setCustomizing(true)} disabled={!prefs.data}>
            <SlidersHorizontal /> Customize
          </Button>
        </div>
        {prefs.data && <CustomizeDialog prefs={prefs.data} open={customizing} onOpenChange={setCustomizing} />}
      </WidgetCard>

      <WidgetCard title="Data sources">
        <ul className="space-y-2.5 text-sm">
          {SOURCES.map((s) => (
            <li key={s.name} className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.use}</p>
              </div>
              <a href={s.url} target={s.url.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="shrink-0 text-muted-foreground hover:text-foreground" aria-label={`Open ${s.name}`}>
                <ExternalLink className="size-4" />
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">
          API keys stay on the server. External data is never invented: when a source is down, {APP_NAME} shows it as unavailable.
        </p>
      </WidgetCard>
    </div>
  );
}
