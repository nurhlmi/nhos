"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { useNow } from "@/hooks/use-now";
import { requestSignInEmail } from "@/features/auth/actions";
import { emailSchema, type EmailInput } from "@/features/auth/schemas";

const RESEND_SECONDS = 60;

export function LoginForm({ next, initialError }: { next?: string; initialError?: string }) {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | undefined>(initialError);
  const [pending, startTransition] = useTransition();
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const now = useNow(1000);

  const form = useForm<EmailInput>({ resolver: zodResolver(emailSchema), defaultValues: { email: "" } });
  const { errors } = form.formState;

  const send = (email: string) =>
    startTransition(async () => {
      setServerError(undefined);
      const result = await requestSignInEmail({ email }, next);
      if ("error" in result) {
        setServerError(result.error);
        return;
      }
      setSentTo(email);
      setCooldownUntil(Date.now() + RESEND_SECONDS * 1000);
    });

  const errorBox = serverError && (
    <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {serverError}
    </p>
  );

  if (!sentTo) {
    return (
      <form onSubmit={form.handleSubmit(({ email }) => send(email))} className="mt-6" noValidate>
        <FieldGroup className="gap-4">
          <Field data-invalid={Boolean(errors.email)}>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input id="email" type="email" autoComplete="email" autoFocus aria-invalid={Boolean(errors.email)} {...form.register("email")} />
            <FieldError errors={[errors.email]} />
          </Field>
          {errorBox}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending && <Loader2 className="animate-spin" />}
            Send verification link
          </Button>
        </FieldGroup>
      </form>
    );
  }

  const remaining = Math.min(RESEND_SECONDS, Math.max(0, Math.ceil((cooldownUntil - (now?.getTime() ?? 0)) / 1000)));

  return (
    <div className="mt-6 space-y-4">
      <div className="flex gap-3 rounded-lg border bg-surface-2 p-4 text-sm">
        <MailCheck className="mt-0.5 size-5 shrink-0 text-primary" />
        <div className="space-y-1.5 text-muted-foreground">
          <p className="font-medium text-foreground">Check your email</p>
          <p>
            If <span className="font-medium text-foreground">{sentTo}</span> is the owner account, a verification link is on its way.
            Open it to sign in. The link works once and expires after 10 minutes.
          </p>
        </div>
      </div>
      {errorBox}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSentTo(null);
            setServerError(undefined);
          }}
        >
          <ArrowLeft /> Use another email
        </Button>
        <Button variant="ghost" size="sm" disabled={pending || remaining > 0} onClick={() => send(sentTo)}>
          {pending && <Loader2 className="animate-spin" />}
          {remaining > 0 ? `Resend in ${remaining}s` : "Resend link"}
        </Button>
      </div>
    </div>
  );
}
