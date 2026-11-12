import { APP_NAME } from "@/lib/env";
import type { Metadata } from "next";
import { Logo } from "@/components/layout/logo";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = { title: "Sign in" };

const errors: Record<string, string> = {
  not_allowed: `This account is not allowed to access ${APP_NAME}.`,
  link_invalid: "That sign-in link is invalid or has expired. Request a new one.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : undefined;
  const errorKey = typeof params.error === "string" ? params.error : undefined;

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <Logo className="mb-8 items-center text-center" />
        <div className="rounded-xl border bg-card p-6">
          <h1 className="text-lg font-semibold">Sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">Passwordless. Enter your email and open the verification link we send.</p>
          <LoginForm next={next} initialError={errorKey ? errors[errorKey] : undefined} />
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          There is no public registration. The owner account is created by the administrator.
        </p>
      </div>
    </div>
  );
}
