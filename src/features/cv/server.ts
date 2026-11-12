import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CvData } from "@/features/cv/types";

/** Loads one CV version and all shared sections for server rendering (RLS applies). */
export async function loadCvData(profileId: string): Promise<CvData | null> {
  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase.from("cv_profiles").select("*").eq("id", profileId).maybeSingle();
  if (!profile) return null;

  const [experiences, educations, skills, projects, certifications, photo] = await Promise.all([
    supabase.from("cv_experiences").select("*").order("sort_order").order("start_date", { ascending: false }),
    supabase.from("cv_educations").select("*").order("sort_order").order("start_year", { ascending: false }),
    supabase.from("cv_skills").select("*").order("sort_order").order("created_at"),
    supabase.from("cv_projects").select("*").order("sort_order").order("start_date", { ascending: false }),
    supabase.from("cv_certifications").select("*").order("sort_order").order("issue_date", { ascending: false }),
    profile.photo_path
      ? supabase.storage.from("cv-photos").createSignedUrl(profile.photo_path, 60 * 30)
      : Promise.resolve({ data: null }),
  ]);

  return {
    profile,
    photoUrl: photo.data?.signedUrl ?? null,
    experiences: experiences.data ?? [],
    educations: educations.data ?? [],
    skills: skills.data ?? [],
    projects: projects.data ?? [],
    certifications: certifications.data ?? [],
  };
}
