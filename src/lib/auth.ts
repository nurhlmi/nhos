import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isOwnerEmail } from "@/config/owner";
import { ensureOwnerRows } from "@/lib/bootstrap";

export type CurrentUser = {
  id: string;
  email: string;
  fullName: string | null;
  professionalTitle: string | null;
  avatarUrl: string | null;
  timezone: string;
};

/**
 * Data Access Layer entry point. Verifies the session against Supabase Auth
 * and the single owner email (src/config/owner.ts). Memoised per request.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user || !isOwnerEmail(data.user.email)) return null;

  const loadProfile = () =>
    supabase.from("profiles").select("full_name, professional_title, avatar_url, timezone").eq("id", data.user.id).maybeSingle();

  let { data: profile } = await loadProfile();
  if (!profile) {
    // Account created before the migrations: create the starter rows once.
    await ensureOwnerRows(supabase, data.user.id, data.user.email ?? "");
    ({ data: profile } = await loadProfile());
  }

  return {
    id: data.user.id,
    email: data.user.email ?? "",
    fullName: profile?.full_name ?? null,
    professionalTitle: profile?.professional_title ?? null,
    avatarUrl: profile?.avatar_url ?? null,
    timezone: profile?.timezone ?? "Asia/Jakarta",
  };
});

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** For route handlers: returns the user or null, never redirects. */
export async function getApiUser(): Promise<CurrentUser | null> {
  return getCurrentUser();
}
