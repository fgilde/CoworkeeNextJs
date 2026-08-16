"use client";

import { useActionState, useState, useTransition } from "react";
import Image from "next/image";
import { Check, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { updateAppearance, uploadLogo, removeLogo } from "@/app/actions/branding-actions";
import { THEME_PRESETS, type ThemePreset } from "@/lib/theming";

type Labels = {
  title: string;
  description: string;
  themePreset: string;
  accentColor: string;
  logo: string;
  logoHint: string;
  uploadLogo: string;
  removeLogo: string;
  currentLogo: string;
  noLogo: string;
  save: string;
  saved: string;
  presets: Record<ThemePreset, { name: string; desc: string }>;
  errors: Record<string, string>;
};

// Tiny visual so each preset radio looks distinct (radius + a font hint).
const PREVIEW: Record<ThemePreset, { radius: string; font: string }> = {
  default: { radius: "0.75rem", font: "var(--font-geist-sans), sans-serif" },
  material: { radius: "1rem", font: "var(--font-roboto), sans-serif" },
  github: { radius: "0.375rem", font: "var(--font-inter), sans-serif" },
  playful: { radius: "1.5rem", font: "var(--font-nunito), sans-serif" },
};

export function AppearanceSection({
  currentPreset,
  currentAccent,
  hasLogo,
  labels,
}: {
  currentPreset: ThemePreset;
  currentAccent: string;
  hasLogo: boolean;
  labels: Labels;
}) {
  const [preset, setPreset] = useState<ThemePreset>(currentPreset);
  const [accent, setAccent] = useState(currentAccent);
  const [savedState, saveAction, saving] = useActionState(updateAppearance, {});
  const [logoState, logoAction, uploading] = useActionState(uploadLogo, {});
  const [isRemoving, startRemove] = useTransition();
  // Cache-bust the logo preview after upload/remove so the browser refetches.
  const [logoV, setLogoV] = useState(0);

  const err = (code?: string) => (code ? (labels.errors[code] ?? code) : null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{labels.title}</CardTitle>
        <CardDescription>{labels.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-8">
        <form action={saveAction} className="flex flex-col gap-6">
          <input type="hidden" name="themePreset" value={preset} />
          <input type="hidden" name="accentColor" value={accent} />

          <fieldset className="flex flex-col gap-3">
            <legend className="mb-1 text-sm font-medium">{labels.themePreset}</legend>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {THEME_PRESETS.map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPreset(p)}
                  aria-pressed={preset === p}
                  className={cn(
                    "relative flex flex-col gap-2 rounded-lg border p-3 text-left transition-all",
                    preset === p
                      ? "border-primary ring-2 ring-primary/40"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  {preset === p && (
                    <span className="absolute top-2 right-2 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="size-3" />
                    </span>
                  )}
                  <div
                    aria-hidden
                    className="flex h-12 items-center justify-center border bg-muted text-xs font-semibold"
                    style={{ borderRadius: PREVIEW[p].radius, fontFamily: PREVIEW[p].font }}
                  >
                    <span
                      className="rounded px-2 py-1 text-[10px]"
                      style={{
                        borderRadius: PREVIEW[p].radius,
                        backgroundColor: accent,
                        color: "#fff",
                      }}
                    >
                      Aa
                    </span>
                  </div>
                  <span className="text-sm font-medium" style={{ fontFamily: PREVIEW[p].font }}>
                    {labels.presets[p].name}
                  </span>
                  <span className="text-xs text-muted-foreground">{labels.presets[p].desc}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-col gap-2">
            <Label htmlFor="accentColor">{labels.accentColor}</Label>
            <div className="flex items-center gap-3">
              <input
                id="accentColor"
                type="color"
                value={accent}
                onChange={(e) => setAccent(e.target.value)}
                className="h-9 w-14 rounded-md border border-input bg-background p-0.5"
              />
              <Input
                value={accent}
                onChange={(e) => setAccent(e.target.value)}
                className="w-32 font-mono"
                aria-label={labels.accentColor}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" aria-hidden />}
              {labels.save}
            </Button>
            {savedState.ok && !saving && (
              <span className="text-sm text-muted-foreground">{labels.saved}</span>
            )}
            {err(savedState.error) && (
              <span className="text-sm text-destructive" role="alert">
                {err(savedState.error)}
              </span>
            )}
          </div>
        </form>

        <div className="flex flex-col gap-3 border-t border-border pt-6">
          <Label>{labels.logo}</Label>
          <p className="text-xs text-muted-foreground">{labels.logoHint}</p>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-16 w-40 items-center justify-center rounded-lg border border-dashed border-border bg-muted/40">
              {hasLogo ? (
                <Image
                  src={`/api/branding/logo?v=${logoV}`}
                  alt={labels.currentLogo}
                  width={140}
                  height={56}
                  unoptimized
                  className="max-h-14 w-auto object-contain"
                />
              ) : (
                <span className="text-xs text-muted-foreground">{labels.noLogo}</span>
              )}
            </div>
            <form
              action={(fd) => {
                logoAction(fd);
                setLogoV((v) => v + 1);
              }}
              className="flex items-center gap-3"
            >
              <Input
                type="file"
                name="logo"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                required
                className="w-56"
              />
              <Button type="submit" variant="outline" size="sm" disabled={uploading}>
                {uploading && <Loader2 className="size-4 animate-spin" aria-hidden />}
                {labels.uploadLogo}
              </Button>
            </form>
            {hasLogo && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isRemoving}
                onClick={() =>
                  startRemove(async () => {
                    await removeLogo();
                    setLogoV((v) => v + 1);
                  })
                }
              >
                <Trash2 className="size-4" aria-hidden />
                {labels.removeLogo}
              </Button>
            )}
          </div>
          {err(logoState.error) && (
            <span className="text-sm text-destructive" role="alert">
              {err(logoState.error)}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
