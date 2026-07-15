"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { changePassword, type AccountActionState } from "@/app/actions/account-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AccountActionState = {};

export function PasswordForm() {
  const t = useTranslations("account");
  const [state, formAction, pending] = useActionState(changePassword, initialState);

  return (
    <form action={formAction} key={state.ok ? "reset" : "form"} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="current">{t("currentPassword")}</Label>
          <Input id="current" name="current" type="password" required autoComplete="current-password" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="next">{t("newPassword")}</Label>
          <Input id="next" name="next" type="password" required minLength={8} autoComplete="new-password" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirm">{t("confirmPassword")}</Label>
          <Input id="confirm" name="confirm" type="password" required minLength={8} autoComplete="new-password" />
        </div>
      </div>

      {state.error && (
        <p className="text-sm text-destructive" role="alert">
          {t(state.error)}
        </p>
      )}
      {state.ok && <p className="text-sm text-emerald-600 dark:text-emerald-400">{t("passwordSuccess")}</p>}

      <div>
        <Button type="submit" disabled={pending}>
          {t("changePassword")}
        </Button>
      </div>
    </form>
  );
}
