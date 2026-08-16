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

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  const l = (max + min) / 2;
  let hue = 0;
  let s = 0;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === r) hue = 60 * (((g - b) / d) % 6);
    else if (max === g) hue = 60 * ((b - r) / d + 2);
    else hue = 60 * ((r - g) / d + 4);
    if (hue < 0) hue += 360;
  }
  return { h: hue, s, l };
}

function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const to = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

// Lighten a too-dark accent so any chosen color stays legible on the dark
// surface. Light mode keeps the exact color; only dark mode raises lightness
// into a readable band. An already-light accent is returned unchanged.
export function adjustAccentForDark(hex: string): string {
  const { h, s, l } = hexToHsl(hex);
  if (l >= 0.6) return hex;
  return hslToHex(h, s, 0.6);
}

// A `.dark { … !important }` rule that overrides the inline light accent when
// the dark class is present, so the dark-adjusted accent wins over the inline
// style (only !important in a stylesheet beats an inline style).
export function darkAccentStyleTag(accentColor: string): string {
  const accent = isValidHex(accentColor) ? accentColor : DEFAULT_ACCENT;
  const dark = adjustAccentForDark(accent);
  const fg = accentForeground(dark);
  const decls = [
    ["--primary", dark],
    ["--primary-foreground", fg],
    ["--ring", dark],
    ["--sidebar-primary", dark],
    ["--sidebar-primary-foreground", fg],
    ["--sidebar-ring", dark],
    ["--chart-1", dark],
  ]
    .map(([k, v]) => `${k}:${v} !important`)
    .join(";");
  return `.dark{${decls}}`;
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
