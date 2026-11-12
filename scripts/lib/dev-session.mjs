// Local-development helper for test scripts: obtains an owner session without
// a password or an inbox, by generating a magic link with the Admin API.
// Refuses to run against anything but a local Supabase instance.
import { createClient } from "@supabase/supabase-js";
import { OWNER_EMAIL } from "../../src/config/owner.ts";

export function assertLocal() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?/.test(url)) {
    console.error("This script only runs against a local Supabase instance.");
    process.exit(1);
  }
}

export const ownerEmail = () => OWNER_EMAIL;

/** One-time token hash for the owner (usable once, like the emailed link). */
export async function generateOwnerTokenHash() {
  assertLocal();
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
  const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email: ownerEmail() });
  if (error) throw error;
  return data.properties.hashed_token;
}

/** Signed-in supabase-js client + session for the owner. */
export async function ownerSession() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key, { auth: { persistSession: false } });
  const { data, error } = await client.auth.verifyOtp({ token_hash: await generateOwnerTokenHash(), type: "magiclink" });
  if (error) throw error;
  return { client, session: data.session, user: data.user };
}
