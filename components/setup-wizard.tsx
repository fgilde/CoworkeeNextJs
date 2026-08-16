"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Loader2 } from "lucide-react";
import { completeSetup } from "@/app/actions/setup-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { THEME_PRESETS, DEFAULT_ACCENT, DEFAULT_PRESET, type ThemePreset } from "@/lib/theming";

const PRESET_RADIUS: Record<ThemePreset, string> = {
  default: "0.75rem",
  material: "1rem",
  github: "0.375rem",
  playful: "1.5rem",
};

export function SetupWizard() {
  const t = useTranslations("setup");
  const tLocale = useTranslations("locale");
  const tAppearance = useTranslations("appearance");
  const [state, formAction, pending] = useActionState(completeSetup, {});
  const [preset, setPreset] = useState<ThemePreset>(DEFAULT_PRESET);
  const [accent, setAccent] = useState(DEFAULT_ACCENT);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="firstName">{t("firstName")}</Label>
          <Input id="firstName" name="firstName" required autoComplete="given-name" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="lastName">{t("lastName")}</Label>
          <Input id="lastName" name="lastName" required autoComplete="family-name" />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">{t("email")}</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">{t("password")}</Label>
          <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="companyName">{t("companyName")}</Label>
        <Input id="companyName" name="companyName" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="defaultLocale">{t("defaultLocale")}</Label>
        <Select name="defaultLocale" defaultValue="de" items={{ de: tLocale("de"), en: tLocale("en") }}>
          <SelectTrigger id="defaultLocale" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="de">{tLocale("de")}</SelectItem>
            <SelectItem value="en">{tLocale("en")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <input type="hidden" name="themePreset" value={preset} />
      <input type="hidden" name="accentColor" value={accent} />
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">{tAppearance("themePreset")}</legend>
        <div className="grid grid-cols-4 gap-2">
          {THEME_PRESETS.map((p) => (
            <button
              type="button"
              key={p}
              onClick={() => setPreset(p)}
              aria-pressed={preset === p}
              className={cn(
                "relative flex flex-col items-center gap-1.5 rounded-lg border p-2 text-center transition-all",
                preset === p ? "border-primary ring-2 ring-primary/40" : "border-border hover:border-primary/50"
              )}
            >
              {preset === p && (
                <span className="absolute top-1 right-1 flex size-3.5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="size-2.5" />
                </span>
              )}
              <span
                aria-hidden
                className="flex h-8 w-full items-center justify-center border bg-muted"
                style={{ borderRadius: PRESET_RADIUS[p] }}
              >
                <span
                  className="px-1.5 py-0.5 text-[9px] text-white"
                  style={{ borderRadius: PRESET_RADIUS[p], backgroundColor: accent }}
                >
                  Aa
                </span>
              </span>
              <span className="text-xs font-medium">{tAppearance(`presets.${p}.name`)}</span>
            </button>
          ))}
        </div>
      </fieldset>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="setup-accent">{tAppearance("accentColor")}</Label>
        <div className="flex items-center gap-3">
          <input
            id="setup-accent"
            type="color"
            value={accent}
            onChange={(e) => setAccent(e.target.value)}
            className="h-9 w-14 rounded-md border border-input bg-background p-0.5"
          />
          <Input value={accent} onChange={(e) => setAccent(e.target.value)} className="w-32 font-mono" />
        </div>
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
  );
}
