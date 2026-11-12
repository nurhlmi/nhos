"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { profileSchema } from "@/features/settings/schemas";

export async function updateProfile(input: unknown): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not signed in" };

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createSupabaseServerClient();
  // Upsert so a missing profile row is created instead of silently updating
  // nothing, and read the row back to confirm it was written.
  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        full_name: parsed.data.full_name,
        professional_title: parsed.data.professional_title || null,
        timezone: parsed.data.timezone,
      },
      { onConflict: "id" },
    )
    .select("id")
    .maybeSingle();
  if (error) {
    console.error("[settings] profile save failed", error.code, error.message);
    return { error: `Profile could not be saved: ${error.message}` };
  }
  if (!data) return { error: "Profile could not be saved: no row was written." };

  revalidatePath("/", "layout");
  return {};
}
