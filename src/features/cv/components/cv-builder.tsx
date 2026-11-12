"use client";

import { useCallback, useMemo, useState } from "react";
import { Copy, MoreHorizontal, Plus, Printer, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ErrorState, ListSkeleton } from "@/components/shared/states";
import type { CvProfileRow } from "@/types/database";
import { useCvItems, useCvPhotoUrl, useCvProfileMutations, useCvProfiles } from "@/features/cv/hooks";
import type { CvData } from "@/features/cv/types";
import { PersonalInfoForm } from "@/features/cv/components/personal-info-form";
import { LayoutEditor } from "@/features/cv/components/layout-editor";
import { CvPreview } from "@/features/cv/components/cv-preview";
import {
  CertificationsEditor,
  EducationEditor,
  ExperienceEditor,
  ProjectsEditor,
  SkillsEditor,
} from "@/features/cv/components/section-editors";

export function CvBuilder() {
  const profiles = useCvProfiles();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<CvProfileRow>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const mutations = useCvProfileMutations();

  const experiences = useCvItems("cv_experiences");
  const educations = useCvItems("cv_educations");
  const skills = useCvItems("cv_skills");
  const projects = useCvItems("cv_projects");
  const certifications = useCvItems("cv_certifications");

  const list = profiles.data ?? [];
  const profile = list.find((p) => p.id === selectedId) ?? list.find((p) => p.is_default) ?? list[0];
  const photo = useCvPhotoUrl(profile?.photo_path ?? null);

  const onDraftChange = useCallback((v: Partial<CvProfileRow>) => setDraft(v), []);
  const selectVersion = (id: string) => {
    setSelectedId(id);
    setDraft({});
  };

  const data: CvData | null = useMemo(() => {
    if (!profile) return null;
    return {
      profile: { ...profile, ...draft, id: profile.id, template: profile.template, section_order: profile.section_order, hidden_sections: profile.hidden_sections },
      photoUrl: photo.data ?? null,
      experiences: experiences.data ?? [],
      educations: educations.data ?? [],
      skills: skills.data ?? [],
      projects: projects.data ?? [],
      certifications: certifications.data ?? [],
    };
  }, [profile, draft, photo.data, experiences.data, educations.data, skills.data, projects.data, certifications.data]);

  if (profiles.isError) return <ErrorState error={profiles.error} onRetry={() => void profiles.refetch()} />;
  if (profiles.isLoading) return <ListSkeleton rows={6} />;

  const openPrint = (autoPrint: boolean) => {
    if (!profile) return;
    window.open(`/cv/print/${profile.id}${autoPrint ? "?print=1" : ""}`, "_blank", "noopener");
  };

  if (!profile || !data) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center">
        <p className="text-sm font-medium">No CV yet</p>
        <Button className="mt-3" onClick={() => mutations.create.mutate(undefined)}><Plus /> Create your first CV</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card p-3">
        <Select value={profile.id} onValueChange={selectVersion}>
          <SelectTrigger className="w-64" aria-label="CV version"><SelectValue /></SelectTrigger>
          <SelectContent>
            {list.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.version_name}
                {p.is_default && <span className="text-xs text-muted-foreground"> · default</span>}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Version actions"><MoreHorizontal /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onSelect={() => mutations.create.mutate(undefined, { onSuccess: (r) => selectVersion(r.id) })}>
              <Plus /> New blank version
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => mutations.create.mutate(profile, { onSuccess: (r) => selectVersion(r.id) })}>
              <Copy /> Duplicate this version
            </DropdownMenuItem>
            {!profile.is_default && (
              <DropdownMenuItem onSelect={() => mutations.setDefault.mutate(profile)}>
                <Star /> Set as default
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" disabled={list.length <= 1} onSelect={() => setConfirmDelete(true)}>
              <Trash2 /> Delete version
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <span className="hidden text-xs text-muted-foreground md:inline">
          Experience, education, skills, projects and certifications are shared by all versions.
        </span>
        <div className="ml-auto flex gap-2">
          <Button onClick={() => openPrint(true)}><Printer /> Print or save as PDF</Button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="min-w-0 rounded-xl border bg-card p-4">
          <Tabs defaultValue="personal">
            <TabsList className="mb-4 w-full justify-start overflow-x-auto [&>button]:flex-none">
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="experience">Experience</TabsTrigger>
              <TabsTrigger value="education">Education</TabsTrigger>
              <TabsTrigger value="skills">Skills</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="certifications">Certifications</TabsTrigger>
              <TabsTrigger value="layout">Layout</TabsTrigger>
            </TabsList>
            <TabsContent value="personal"><PersonalInfoForm profile={profile} onDraftChange={onDraftChange} /></TabsContent>
            <TabsContent value="experience"><ExperienceEditor /></TabsContent>
            <TabsContent value="education"><EducationEditor /></TabsContent>
            <TabsContent value="skills"><SkillsEditor /></TabsContent>
            <TabsContent value="projects"><ProjectsEditor /></TabsContent>
            <TabsContent value="certifications"><CertificationsEditor /></TabsContent>
            <TabsContent value="layout"><LayoutEditor profile={profile} /></TabsContent>
          </Tabs>
        </div>
        <div className="min-w-0 xl:sticky xl:top-20 xl:self-start">
          <div className="rounded-xl border bg-surface-2 p-4">
            <CvPreview data={data} />
          </div>
        </div>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{profile.version_name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the version&apos;s personal info, photo and layout. Shared experience, education and other sections are kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() =>
                mutations.remove.mutate(profile, {
                  onSuccess: () => {
                    setSelectedId(null);
                    setDraft({});
                  },
                })
              }
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
