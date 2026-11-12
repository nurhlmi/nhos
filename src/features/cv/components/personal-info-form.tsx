"use client";

import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useShellUser, initials } from "@/components/layout/user-context";
import type { CvProfileRow } from "@/types/database";
import { useCvPhotoUrl, useCvProfileMutations } from "@/features/cv/hooks";
import { personalInfoSchema, type PersonalInfoValues } from "@/features/cv/schemas";
import { FormField } from "@/features/cv/components/form-dialog";

const toValues = (p: CvProfileRow): PersonalInfoValues => ({
  version_name: p.version_name,
  full_name: p.full_name,
  professional_title: p.professional_title ?? "",
  email: p.email ?? "",
  phone: p.phone ?? "",
  location: p.location ?? "",
  website: p.website ?? "",
  linkedin_url: p.linkedin_url ?? "",
  github_url: p.github_url ?? "",
  portfolio_url: p.portfolio_url ?? "",
  summary: p.summary ?? "",
});

export function PersonalInfoForm({ profile, onDraftChange }: { profile: CvProfileRow; onDraftChange: (v: Partial<CvProfileRow>) => void }) {
  const user = useShellUser();
  const { update, uploadPhoto, removePhoto } = useCvProfileMutations();
  const photo = useCvPhotoUrl(profile.photo_path);
  const fileRef = useRef<HTMLInputElement>(null);
  const form = useForm<PersonalInfoValues>({ resolver: zodResolver(personalInfoSchema), defaultValues: toValues(profile) });
  const { errors, isDirty } = form.formState;

  // Reset when switching CV version.
  useEffect(() => {
    form.reset(toValues(profile));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when the version changes
  }, [profile.id]);

  // Live preview of unsaved edits.
  useEffect(() => {
    return form.subscribe({
      formState: { values: true },
      callback: ({ values }) => onDraftChange(values as Partial<CvProfileRow>),
    });
  }, [form, onDraftChange]);

  const onSubmit = form.handleSubmit(async (v) => {
    const nullable = (s: string) => (s ? s : null);
    await update
      .mutateAsync({
        id: profile.id,
        values: {
          version_name: v.version_name,
          full_name: v.full_name,
          professional_title: nullable(v.professional_title),
          email: nullable(v.email),
          phone: nullable(v.phone),
          location: nullable(v.location),
          website: nullable(v.website),
          linkedin_url: nullable(v.linkedin_url),
          github_url: nullable(v.github_url),
          portfolio_url: nullable(v.portfolio_url),
          summary: nullable(v.summary),
        },
      })
      .then(() => form.reset(v))
      .catch(() => undefined);
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div className="flex items-center gap-4">
        <Avatar className="size-16">
          {photo.data && <AvatarImage src={photo.data} alt="" className="object-cover" />}
          <AvatarFallback className="bg-primary/15 text-primary">{initials(profile.full_name || null, user.email)}</AvatarFallback>
        </Avatar>
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadPhoto.mutate({ row: profile, file, userId: user.id });
              e.target.value = "";
            }}
          />
          <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploadPhoto.isPending}>
            {uploadPhoto.isPending ? <Loader2 className="animate-spin" /> : <Camera />} {profile.photo_path ? "Change photo" : "Upload photo"}
          </Button>
          {profile.photo_path && (
            <Button type="button" variant="ghost" size="sm" onClick={() => removePhoto.mutate(profile)}>
              <X /> Remove
            </Button>
          )}
          <p className="w-full text-[11px] text-muted-foreground">PNG, JPG or WebP, max 2 MB. Shown on templates that support a photo.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="version_name" label="Version name" error={errors.version_name} className="sm:col-span-2">
          <Input id="version_name" placeholder="e.g. Backend Engineer – 2026" {...form.register("version_name")} />
        </FormField>
        <FormField id="full_name" label="Full name" error={errors.full_name}><Input id="full_name" {...form.register("full_name")} /></FormField>
        <FormField id="professional_title" label="Professional title" error={errors.professional_title}>
          <Input id="professional_title" {...form.register("professional_title")} />
        </FormField>
        <FormField id="email" label="Email" error={errors.email}><Input id="email" type="email" {...form.register("email")} /></FormField>
        <FormField id="phone" label="Phone" error={errors.phone}><Input id="phone" type="tel" {...form.register("phone")} /></FormField>
        <FormField id="location" label="Location" error={errors.location}><Input id="location" {...form.register("location")} /></FormField>
        <FormField id="website" label="Website" error={errors.website}><Input id="website" type="url" placeholder="https://" {...form.register("website")} /></FormField>
        <FormField id="linkedin_url" label="LinkedIn" error={errors.linkedin_url}><Input id="linkedin_url" type="url" placeholder="https://linkedin.com/in/…" {...form.register("linkedin_url")} /></FormField>
        <FormField id="github_url" label="GitHub" error={errors.github_url}><Input id="github_url" type="url" placeholder="https://github.com/…" {...form.register("github_url")} /></FormField>
        <FormField id="portfolio_url" label="Portfolio URL" error={errors.portfolio_url} className="sm:col-span-2">
          <Input id="portfolio_url" type="url" {...form.register("portfolio_url")} />
        </FormField>
        <FormField id="summary" label="Professional summary" error={errors.summary} className="sm:col-span-2">
          <Textarea id="summary" rows={5} {...form.register("summary")} />
        </FormField>
      </div>
      <div className="flex items-center justify-end gap-3">
        {isDirty && <span className="text-xs text-warning">Unsaved changes</span>}
        <Button type="submit" disabled={update.isPending || !isDirty}>
          {update.isPending && <Loader2 className="animate-spin" />} Save personal info
        </Button>
      </div>
    </form>
  );
}
