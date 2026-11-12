import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { CV_SECTIONS } from "@/features/cv/types";
import type { Database } from "@/types/database";

/**
 * Creates the owner's starter rows if they are missing. The database trigger
 * normally does this when the account is created, but an account created
 * before the migrations were applied has none of them, which made profile
 * saves silently update zero rows. Every insert is idempotent and runs under
 * the owner's session (RLS applies).
 */
export async function ensureOwnerRows(supabase: SupabaseClient<Database>, userId: string, email: string) {
  const fallbackName = email.split("@")[0] ?? "";

  const [{ error: profileError }, { error: prefsError }] = await Promise.all([
    supabase.from("profiles").upsert({ id: userId, full_name: fallbackName }, { onConflict: "id", ignoreDuplicates: true }),
    supabase.from("dashboard_preferences").upsert({ user_id: userId }, { onConflict: "user_id", ignoreDuplicates: true }),
  ]);
  if (profileError) console.error("[bootstrap] profiles", profileError.message);
  if (prefsError) console.error("[bootstrap] dashboard_preferences", prefsError.message);

  const [{ count: cvCount }, { count: watchCount }] = await Promise.all([
    supabase.from("cv_profiles").select("id", { count: "exact", head: true }),
    supabase.from("currency_watchlists").select("id", { count: "exact", head: true }),
  ]);

  if (cvCount === 0) {
    const { error } = await supabase.from("cv_profiles").insert({
      version_name: "Main CV",
      is_default: true,
      full_name: "",
      email,
      section_order: [...CV_SECTIONS],
    });
    if (error) console.error("[bootstrap] cv_profiles", error.message);
  }

  if (watchCount === 0) {
    const { error } = await supabase.from("currency_watchlists").insert([
      { base_currency: "USD", quote_currency: "IDR", position: 0 },
      { base_currency: "EUR", quote_currency: "IDR", position: 1 },
      { base_currency: "SGD", quote_currency: "IDR", position: 2 },
    ]);
    if (error && error.code !== "23505") console.error("[bootstrap] currency_watchlists", error.message);
  }
}
