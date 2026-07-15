"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { updateOwnProfile, type AccountActionState } from "@/app/actions/account-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type AccountFormInitial = {
  phone?: string | null;
  street?: string | null;
  city?: string | null;
  country?: string | null;
};

const initialState: AccountActionState = {};

export function AccountForm({ initial }: { initial: AccountFormInitial }) {
  const t = useTranslations("account");
  const [state, formAction, pending] = useActionState(updateOwnProfile, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="phone">{t("phone")}</Label>
          <Input id="phone" name="phone" defaultValue={initial.phone ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="street">{t("street")}</Label>
          <Input id="street" name="street" defaultValue={initial.street ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="city">{t("city")}</Label>
          <Input id="city" name="city" defaultValue={initial.city ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="country">{t("country")}</Label>
          <Input id="country" name="country" defaultValue={initial.country ?? ""} />
        </div>
      </div>

      {state.error && (
        <p className="text-sm text-destructive" role="alert">
          {t(state.error)}
        </p>
      )}
      {state.ok && <p className="text-sm text-emerald-600 dark:text-emerald-400">{t("profileSuccess")}</p>}

      <div>
        <Button type="submit" disabled={pending}>
          {t("save")}
        </Button>
      </div>
    </form>
  );
}
