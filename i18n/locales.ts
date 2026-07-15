// Locale constants only — no "next/headers" import — so client components
// (e.g. the locale switcher) can use them without pulling server-only code
// into the browser bundle. i18n/request.ts re-exports these for server use.
export const locales = ["de", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "de";

export function isLocale(value: string | undefined): value is Locale {
  return (locales as readonly string[]).includes(value ?? "");
}
