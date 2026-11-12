// Public values are inlined into the client bundle by Next.js, so they must be
// referenced with their full literal name (no dynamic process.env access).
const publicEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseKey:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    "",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
};

export function getPublicEnv() {
  return publicEnv;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(publicEnv.supabaseUrl && publicEnv.supabaseKey);
}

/** Product name shown in the UI, page titles and outgoing User-Agent headers. */
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME?.trim() || "nhOS";

/** Short form for the collapsed sidebar: the first two characters of the name. */
export const APP_SHORT_NAME = APP_NAME.slice(0, 2);
