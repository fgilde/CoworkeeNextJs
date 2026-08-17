"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { resetPassword } from "@/app/actions/reset-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ResetPasswordForm({ token }: { token: string }) {
  const t = useTranslations("auth");
  const [state, formAction, pending] = useActionState(resetPassword, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">{t("reset.newPassword")}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          disabled={pending}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirm">{t("reset.confirm")}</Label>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          disabled={pending}
        />
      </div>
      {state.error && (
        <p
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {t(`reset.errors.${state.error}`)}
        </p>
      )}
      <Button type="submit" disabled={pending} className="w-full">
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {t("reset.submit")}
      </Button>
      <Link href="/login" className="text-center text-sm text-primary underline underline-offset-2">
        {t("forgot.backToLogin")}
      </Link>
    </form>
  );
}
