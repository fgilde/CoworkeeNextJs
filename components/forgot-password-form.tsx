"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { requestPasswordReset } from "@/app/actions/reset-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordForm() {
  const t = useTranslations("auth");
  const [state, formAction, pending] = useActionState(requestPasswordReset, {});

  if (state.ok) {
    return (
      <div className="flex flex-col gap-4">
        <p
          className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground"
          role="status"
        >
          {t("forgot.sent")}
        </p>
        <Link href="/login" className="text-sm text-primary underline underline-offset-2">
          {t("forgot.backToLogin")}
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">{t("email")}</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required disabled={pending} />
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {t("forgot.submit")}
      </Button>
      <Link href="/login" className="text-center text-sm text-primary underline underline-offset-2">
        {t("forgot.backToLogin")}
      </Link>
    </form>
  );
}
