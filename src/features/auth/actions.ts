"use server";

import { redirect } from "next/navigation";
import { isOwnerEmail } from "@/config/owner";
import { getPublicEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { emailSchema } from "@/features/auth/schemas";

export type AuthResult = { ok: true } | { error: string };

function safeNext(next: unknown): string {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
}

/**
 * Passwordless sign-in by email verification: emails a one-time link.
 * Only the owner address gets an email; any other address receives the same
 * response so the form does not reveal which address is allowed.
 * shouldCreateUser=false means this can never create an account.
 */
export async function requestSignInEmail(input: unknown, next?: string): Promise<AuthResult> {
  const parsed = emailSchema.safeParse(input);
  if (!parsed.success) return { error: "Enter a valid email address." };
  const { email } = parsed.data;

  if (!isOwnerEmail(email)) return { ok: true };

  const supabase = await createSupabaseServerClient();
  const callback = new URL("/auth/callback", getPublicEnv().siteUrl);
  callback.searchParams.set("next", safeNext(next));

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false, emailRedirectTo: callback.toString() },
  });

  if (error) {
    if (error.status === 429) return { error: "Too many requests. Wait a minute before requesting another email." };
    // Owner account not created yet: answer like a success (no enumeration).
    if (error.status === 400 || error.status === 422) return { ok: true };
    console.error("[auth] sign-in email failed", error.status, error.code);
    return { error: "Could not send the verification email. Try again shortly." };
  }
  return { ok: true };
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
