import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isOwnerEmail } from "@/config/owner";

const OTP_TYPES: EmailOtpType[] = ["email", "magiclink"];

function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

/**
 * Magic-link landing route. Supports both the token_hash link (recommended
 * for SSR, works in any browser) and the PKCE `code` link.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const next = safeNext(searchParams.get("next"));
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");

  const supabase = await createSupabaseServerClient();
  let failed = true;

  if (tokenHash && type && OTP_TYPES.includes(type)) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    failed = Boolean(error);
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    failed = Boolean(error);
  }

  const loginUrl = new URL("/login", request.url);
  if (failed) {
    loginUrl.searchParams.set("error", "link_invalid");
    return NextResponse.redirect(loginUrl);
  }

  const { data } = await supabase.auth.getUser();
  if (!isOwnerEmail(data.user?.email)) {
    await supabase.auth.signOut();
    loginUrl.searchParams.set("error", "not_allowed");
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.redirect(new URL(next, request.url));
}
