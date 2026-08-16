import type { CSSProperties } from "react";

// The style presets selectable in setup + settings. Each id maps to a
// `:root[data-theme-preset="…"]` block in app/globals.css (default uses the
// base tokens). Display names are translated via the `appearance.presets` i18n
// namespace using these ids.
export const THEME_PRESETS = ["default", "material", "github", "playful"] as const;
export type ThemePreset = (typeof THEME_PRESETS)[number];

export const DEFAULT_ACCENT = "#6366f1";
export const DEFAULT_PRESET: ThemePreset = "default";

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export function isValidHex(value: unknown): value is string {
  return typeof value === "string" && HEX_RE.test(value);
}

export function isValidPreset(value: unknown): value is ThemePreset {
  return typeof value === "string" && (THEME_PRESETS as readonly string[]).includes(value);
}

// Pick a readable foreground for text/icons sitting on top of the accent
// (buttons). Uses the standard sRGB relative-luminance threshold.
export function accentForeground(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const luminance = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return luminance > 0.55 ? "#111827" : "#ffffff";
}

// Inline CSS vars applied on <html> so the accent overrides the token defaults
// (and the .dark class rules) in both light and dark — inline styles beat any
// stylesheet selector, so the brand accent drives primary/interactive states
// without a specificity fight. Body text keeps the token colors untouched.
export function accentStyle(accentColor: string): CSSProperties {
  const accent = isValidHex(accentColor) ? accentColor : DEFAULT_ACCENT;
  const fg = accentForeground(accent);
  return {
    "--primary": accent,
    "--primary-foreground": fg,
    "--ring": accent,
    "--sidebar-primary": accent,
    "--sidebar-primary-foreground": fg,
    "--sidebar-ring": accent,
    "--chart-1": accent,
  } as CSSProperties;
}

export type Branding = {
  companyName: string | null;
  accentColor: string;
  themePreset: ThemePreset;
  logoPath: string | null;
};
