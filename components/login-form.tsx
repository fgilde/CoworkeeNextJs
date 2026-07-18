"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { loginAction } from "@/app/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DEMO_PASSWORD = "coworkee";
const DEMO_ACCOUNTS = [
  { roleKey: "admin", email: "admin@coworkee.test" },
  { roleKey: "hr", email: "hr@coworkee.test" },
  { roleKey: "manager", email: "manager@coworkee.test" },
  { roleKey: "employee", email: "employee@coworkee.test" },
] as const;

export function LoginForm() {
  const t = useTranslations("auth");
  const tDemo = useTranslations("auth.demo");
  const [state, formAction, pending] = useActionState(loginAction, {});
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="flex flex-col gap-6">
      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">{t("email")}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">{t("password")}</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {state.error && (
          <p className="text-sm text-destructive" role="alert">
            {t(state.error)}
          </p>
        )}
        <Button type="submit" disabled={pending} className="w-full">
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {t("submit")}
        </Button>
      </form>

      {process.env.NEXT_PUBLIC_DEMO === "1" && (
        <div className="rounded-xl border border-dashed border-border bg-muted/40 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{tDemo("title")}</p>
            <p className="text-xs text-muted-foreground">{tDemo("hint")}</p>
          </div>
          <div className="mt-3 flex flex-col gap-1.5">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => {
                  setEmail(account.email);
                  setPassword(DEMO_PASSWORD);
                }}
                className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2 text-left text-sm transition-colors hover:border-primary/50 hover:bg-accent focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <span className="font-medium">{tDemo(`roles.${account.roleKey}`)}</span>
                <span className="truncate font-mono text-xs text-muted-foreground">{account.email}</span>
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {tDemo("passwordLabel")}: <span className="font-mono font-semibold text-foreground">{DEMO_PASSWORD}</span>
          </p>
        </div>
      )}
    </div>
  );
}
