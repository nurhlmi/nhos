import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/layout/logo";
import { APP_NAME, isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = { title: "Setup required" };

export default function SetupPage() {
  if (isSupabaseConfigured()) redirect("/");

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4">
      <div className="w-full max-w-lg rounded-xl border bg-card p-6">
        <Logo />
        <h1 className="mt-6 text-lg font-semibold">Supabase is not configured</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {APP_NAME} needs a Supabase project for authentication and storage. Copy <code className="font-mono">.env.example</code> to{" "}
          <code className="font-mono">.env.local</code>, fill in the values, then restart the dev server.
        </p>
        <pre className="mt-4 overflow-x-auto rounded-lg bg-muted p-3 font-mono text-xs leading-relaxed">
{`NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
`}
        </pre>
        <p className="mt-4 text-sm text-muted-foreground">See README.md for the full installation guide.</p>
      </div>
    </div>
  );
}
