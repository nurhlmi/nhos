"use client";

import { useState } from "react";
import { Controller, useForm, useWatch, type DefaultValues, type FieldValues, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type {
  CvCertificationRow,
  CvEducationRow,
  CvExperienceRow,
  CvProjectRow,
  CvSkillRow,
} from "@/types/database";
import { formatDate } from "@/utils/format";
import { useCvItemMutations, useCvItems, type CvItemTable } from "@/features/cv/hooks";
import {
  certificationSchema,
  commaToArray,
  educationSchema,
  experienceSchema,
  linesToArray,
  projectSchema,
  skillSchema,
  type CertificationValues,
  type EducationValues,
  type ExperienceValues,
  type ProjectValues,
  type SkillValues,
} from "@/features/cv/schemas";
import { EMPLOYMENT_LABELS, SKILL_LEVEL_LABELS } from "@/features/cv/types";
import { ItemList } from "@/features/cv/components/item-list";
import { FormDialog, FormField } from "@/features/cv/components/form-dialog";

/** Shared dialog state + mutations for one CV section table. */
function useSectionEditor<Row extends { id: string }, Values extends FieldValues>(
  table: CvItemTable,
  noun: string,
  schema: Parameters<typeof zodResolver>[0],
  toValues: (row: Row | null) => DefaultValues<Values>,
) {
  const [editing, setEditing] = useState<Row | null>(null);
  const [open, setOpen] = useState(false);
  const { save, remove, reorder } = useCvItemMutations(table, noun);
  const form = useForm<Values>({ resolver: zodResolver(schema) as unknown as Resolver<Values>, defaultValues: toValues(null) });

  const openFor = (row: Row | null) => {
    setEditing(row);
    form.reset(toValues(row));
    setOpen(true);
  };

  return { editing, open, setOpen, openFor, form, save, remove, reorder };
}

// Experience

export function ExperienceEditor() {
  const items = useCvItems("cv_experiences");
  const ed = useSectionEditor<CvExperienceRow, ExperienceValues>("cv_experiences", "Experience", experienceSchema, (r) => ({
    company: r?.company ?? "",
    position: r?.position ?? "",
    employment_type: r?.employment_type ?? "full_time",
    location: r?.location ?? "",
    start_date: r?.start_date ?? "",
    end_date: r?.end_date ?? "",
    is_current: r?.is_current ?? false,
    description: r?.description ?? "",
    responsibilities: r?.responsibilities.join("\n") ?? "",
    achievements: r?.achievements.join("\n") ?? "",
  }));
  const { errors } = ed.form.formState;
  const isCurrent = useWatch({ control: ed.form.control, name: "is_current" });

  const onSubmit = ed.form.handleSubmit(async (v) => {
    await ed.save.mutateAsync({
      id: ed.editing?.id,
      values: {
        ...v,
        location: v.location || null,
        end_date: v.is_current || !v.end_date ? null : v.end_date,
        description: v.description || null,
        responsibilities: linesToArray(v.responsibilities),
        achievements: linesToArray(v.achievements),
        ...(ed.editing ? {} : { sort_order: items.data?.length ?? 0 }),
      },
    });
    ed.setOpen(false);
  });

  return (
    <>
      <ItemList
        items={items.data}
        isLoading={items.isLoading}
        error={items.error}
        noun="Experience"
        title={(e) => `${e.position} · ${e.company}`}
        subtitle={(e) => `${formatDate(e.start_date, "MMM yyyy")} – ${e.is_current ? "Present" : formatDate(e.end_date, "MMM yyyy")} · ${EMPLOYMENT_LABELS[e.employment_type]}`}
        onAdd={() => ed.openFor(null)}
        onEdit={ed.openFor}
        onDelete={(e) => ed.remove.mutateAsync(e.id)}
        onReorder={(ids) => ed.reorder.mutate(ids)}
      />
      <FormDialog open={ed.open} onOpenChange={ed.setOpen} title={ed.editing ? "Edit experience" : "Add experience"} pending={ed.save.isPending} onSubmit={onSubmit}>
        <FormField id="company" label="Company" error={errors.company}><Input id="company" {...ed.form.register("company")} /></FormField>
        <FormField id="position" label="Position" error={errors.position}><Input id="position" {...ed.form.register("position")} /></FormField>
        <FormField id="employment_type" label="Employment type">
          <Controller
            control={ed.form.control}
            name="employment_type"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="employment_type" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(EMPLOYMENT_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          />
        </FormField>
        <FormField id="location" label="Location" error={errors.location}><Input id="location" {...ed.form.register("location")} /></FormField>
        <FormField id="start_date" label="Start date" error={errors.start_date}><Input id="start_date" type="date" {...ed.form.register("start_date")} /></FormField>
        <FormField id="end_date" label="End date" error={errors.end_date}>
          <Input id="end_date" type="date" disabled={isCurrent} {...ed.form.register("end_date")} />
        </FormField>
        <div className="flex items-center gap-2 sm:col-span-2">
          <Controller
            control={ed.form.control}
            name="is_current"
            render={({ field }) => <Checkbox id="is_current" checked={field.value} onCheckedChange={(c) => field.onChange(c === true)} />}
          />
          <Label htmlFor="is_current" className="font-normal">I currently work here</Label>
        </div>
        <FormField id="description" label="Description" className="sm:col-span-2" error={errors.description}>
          <Textarea id="description" rows={2} {...ed.form.register("description")} />
        </FormField>
        <FormField id="responsibilities" label="Responsibilities (one per line)" className="sm:col-span-2" error={errors.responsibilities}>
          <Textarea id="responsibilities" rows={4} {...ed.form.register("responsibilities")} />
        </FormField>
        <FormField id="achievements" label="Achievements (one per line)" className="sm:col-span-2" error={errors.achievements}>
          <Textarea id="achievements" rows={3} {...ed.form.register("achievements")} />
        </FormField>
      </FormDialog>
    </>
  );
}

// Education

export function EducationEditor() {
  const items = useCvItems("cv_educations");
  const ed = useSectionEditor<CvEducationRow, EducationValues>("cv_educations", "Education", educationSchema, (r) => ({
    institution: r?.institution ?? "",
    degree: r?.degree ?? "",
    major: r?.major ?? "",
    start_year: r?.start_year ?? new Date().getFullYear() - 4,
    graduation_year: r?.graduation_year ?? null,
    description: r?.description ?? "",
  }));
  const { errors } = ed.form.formState;

  const onSubmit = ed.form.handleSubmit(async (v) => {
    await ed.save.mutateAsync({
      id: ed.editing?.id,
      values: { ...v, major: v.major || null, description: v.description || null, ...(ed.editing ? {} : { sort_order: items.data?.length ?? 0 }) },
    });
    ed.setOpen(false);
  });

  return (
    <>
      <ItemList
        items={items.data}
        isLoading={items.isLoading}
        error={items.error}
        noun="Education"
        title={(e) => e.institution}
        subtitle={(e) => `${e.degree}${e.major ? `, ${e.major}` : ""} · ${e.start_year} – ${e.graduation_year ?? "Present"}`}
        onAdd={() => ed.openFor(null)}
        onEdit={ed.openFor}
        onDelete={(e) => ed.remove.mutateAsync(e.id)}
        onReorder={(ids) => ed.reorder.mutate(ids)}
      />
      <FormDialog open={ed.open} onOpenChange={ed.setOpen} title={ed.editing ? "Edit education" : "Add education"} pending={ed.save.isPending} onSubmit={onSubmit}>
        <FormField id="institution" label="Institution" className="sm:col-span-2" error={errors.institution}><Input id="institution" {...ed.form.register("institution")} /></FormField>
        <FormField id="degree" label="Degree" error={errors.degree}><Input id="degree" placeholder="Bachelor of Science" {...ed.form.register("degree")} /></FormField>
        <FormField id="major" label="Major" error={errors.major}><Input id="major" {...ed.form.register("major")} /></FormField>
        <FormField id="start_year" label="Start year" error={errors.start_year}>
          <Input id="start_year" type="number" {...ed.form.register("start_year", { valueAsNumber: true })} />
        </FormField>
        <FormField id="graduation_year" label="Graduation year" error={errors.graduation_year}>
          <Input
            id="graduation_year"
            type="number"
            placeholder="Leave empty if ongoing"
            {...ed.form.register("graduation_year", { setValueAs: (v: unknown) => (v === "" || v === null || v === undefined ? null : Number(v)) })}
          />
        </FormField>
        <FormField id="edu_description" label="Description" className="sm:col-span-2" error={errors.description}>
          <Textarea id="edu_description" rows={3} {...ed.form.register("description")} />
        </FormField>
      </FormDialog>
    </>
  );
}

// Skills

export function SkillsEditor() {
  const items = useCvItems("cv_skills");
  const ed = useSectionEditor<CvSkillRow, SkillValues>("cv_skills", "Skill", skillSchema, (r) => ({
    name: r?.name ?? "",
    category: r?.category ?? "",
    level: r?.level ?? "intermediate",
  }));
  const { errors } = ed.form.formState;
  const categories = [...new Set((items.data ?? []).map((s) => s.category))];

  const onSubmit = ed.form.handleSubmit(async (v) => {
    await ed.save.mutateAsync({ id: ed.editing?.id, values: { ...v, ...(ed.editing ? {} : { sort_order: items.data?.length ?? 0 }) } });
    ed.setOpen(false);
  });

  return (
    <>
      <ItemList
        items={items.data}
        isLoading={items.isLoading}
        error={items.error}
        noun="Skill"
        title={(s) => s.name}
        subtitle={(s) => `${s.category} · ${SKILL_LEVEL_LABELS[s.level]}`}
        onAdd={() => ed.openFor(null)}
        onEdit={ed.openFor}
        onDelete={(s) => ed.remove.mutateAsync(s.id)}
        onReorder={(ids) => ed.reorder.mutate(ids)}
      />
      <FormDialog open={ed.open} onOpenChange={ed.setOpen} title={ed.editing ? "Edit skill" : "Add skill"} pending={ed.save.isPending} onSubmit={onSubmit}>
        <FormField id="skill_name" label="Skill name" error={errors.name}><Input id="skill_name" {...ed.form.register("name")} /></FormField>
        <FormField id="skill_category" label="Category" error={errors.category}>
          <Input id="skill_category" list="skill-categories" placeholder="e.g. Languages, Cloud" {...ed.form.register("category")} />
          <datalist id="skill-categories">{categories.map((c) => <option key={c} value={c} />)}</datalist>
        </FormField>
        <FormField id="skill_level" label="Proficiency level">
          <Controller
            control={ed.form.control}
            name="level"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="skill_level" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(SKILL_LEVEL_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          />
        </FormField>
      </FormDialog>
    </>
  );
}

// Projects

export function ProjectsEditor() {
  const items = useCvItems("cv_projects");
  const ed = useSectionEditor<CvProjectRow, ProjectValues>("cv_projects", "Project", projectSchema, (r) => ({
    name: r?.name ?? "",
    description: r?.description ?? "",
    technologies: r?.technologies.join(", ") ?? "",
    project_url: r?.project_url ?? "",
    github_url: r?.github_url ?? "",
    start_date: r?.start_date ?? "",
    end_date: r?.end_date ?? "",
  }));
  const { errors } = ed.form.formState;

  const onSubmit = ed.form.handleSubmit(async (v) => {
    await ed.save.mutateAsync({
      id: ed.editing?.id,
      values: {
        name: v.name,
        description: v.description || null,
        technologies: commaToArray(v.technologies),
        project_url: v.project_url || null,
        github_url: v.github_url || null,
        start_date: v.start_date || null,
        end_date: v.end_date || null,
        ...(ed.editing ? {} : { sort_order: items.data?.length ?? 0 }),
      },
    });
    ed.setOpen(false);
  });

  return (
    <>
      <ItemList
        items={items.data}
        isLoading={items.isLoading}
        error={items.error}
        noun="Project"
        title={(p) => p.name}
        subtitle={(p) => p.technologies.join(", ") || "No technologies listed"}
        onAdd={() => ed.openFor(null)}
        onEdit={ed.openFor}
        onDelete={(p) => ed.remove.mutateAsync(p.id)}
        onReorder={(ids) => ed.reorder.mutate(ids)}
      />
      <FormDialog open={ed.open} onOpenChange={ed.setOpen} title={ed.editing ? "Edit project" : "Add project"} pending={ed.save.isPending} onSubmit={onSubmit}>
        <FormField id="project_name" label="Project name" className="sm:col-span-2" error={errors.name}><Input id="project_name" {...ed.form.register("name")} /></FormField>
        <FormField id="project_description" label="Description" className="sm:col-span-2" error={errors.description}>
          <Textarea id="project_description" rows={3} {...ed.form.register("description")} />
        </FormField>
        <FormField id="technologies" label="Technologies (comma separated)" className="sm:col-span-2" error={errors.technologies}>
          <Input id="technologies" placeholder="Next.js, PostgreSQL, Tailwind CSS" {...ed.form.register("technologies")} />
        </FormField>
        <FormField id="project_url" label="Project URL" error={errors.project_url}><Input id="project_url" type="url" {...ed.form.register("project_url")} /></FormField>
        <FormField id="project_github" label="GitHub URL" error={errors.github_url}><Input id="project_github" type="url" {...ed.form.register("github_url")} /></FormField>
        <FormField id="project_start" label="Start date" error={errors.start_date}><Input id="project_start" type="date" {...ed.form.register("start_date")} /></FormField>
        <FormField id="project_end" label="End date" error={errors.end_date}><Input id="project_end" type="date" {...ed.form.register("end_date")} /></FormField>
      </FormDialog>
    </>
  );
}

// Certifications & awards

export function CertificationsEditor() {
  const items = useCvItems("cv_certifications");
  const ed = useSectionEditor<CvCertificationRow, CertificationValues>("cv_certifications", "Certification", certificationSchema, (r) => ({
    name: r?.name ?? "",
    issuer: r?.issuer ?? "",
    issue_date: r?.issue_date ?? "",
    credential_url: r?.credential_url ?? "",
  }));
  const { errors } = ed.form.formState;

  const onSubmit = ed.form.handleSubmit(async (v) => {
    await ed.save.mutateAsync({
      id: ed.editing?.id,
      values: {
        name: v.name,
        issuer: v.issuer,
        issue_date: v.issue_date || null,
        credential_url: v.credential_url || null,
        ...(ed.editing ? {} : { sort_order: items.data?.length ?? 0 }),
      },
    });
    ed.setOpen(false);
  });

  return (
    <>
      <ItemList
        items={items.data}
        isLoading={items.isLoading}
        error={items.error}
        noun="Certification"
        title={(c) => c.name}
        subtitle={(c) => `${c.issuer}${c.issue_date ? ` · ${formatDate(c.issue_date, "MMM yyyy")}` : ""}`}
        onAdd={() => ed.openFor(null)}
        onEdit={ed.openFor}
        onDelete={(c) => ed.remove.mutateAsync(c.id)}
        onReorder={(ids) => ed.reorder.mutate(ids)}
      />
      <FormDialog open={ed.open} onOpenChange={ed.setOpen} title={ed.editing ? "Edit certification" : "Add certification or award"} pending={ed.save.isPending} onSubmit={onSubmit}>
        <FormField id="cert_name" label="Name" className="sm:col-span-2" error={errors.name}><Input id="cert_name" {...ed.form.register("name")} /></FormField>
        <FormField id="cert_issuer" label="Issuer" error={errors.issuer}><Input id="cert_issuer" {...ed.form.register("issuer")} /></FormField>
        <FormField id="cert_date" label="Issue date" error={errors.issue_date}><Input id="cert_date" type="date" {...ed.form.register("issue_date")} /></FormField>
        <FormField id="cert_url" label="Credential URL" className="sm:col-span-2" error={errors.credential_url}>
          <Input id="cert_url" type="url" {...ed.form.register("credential_url")} />
        </FormField>
      </FormDialog>
    </>
  );
}
