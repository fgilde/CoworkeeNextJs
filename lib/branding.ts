import { db } from "@/lib/db";
import {
  DEFAULT_ACCENT,
  DEFAULT_PRESET,
  isValidHex,
  isValidPreset,
  type Branding,
} from "@/lib/theming";

// Reads the singleton CompanySettings for the root layout. Falls back to
// defaults for a fresh/empty DB (setup not yet run) or a transient DB error,
// so public pages (marketing/login) never 500 on branding.
export async function getBranding(): Promise<Branding> {
  try {
    const cs = await db.companySettings.findUnique({ where: { id: "singleton" } });
    return {
      companyName: cs?.companyName ?? null,
      accentColor: isValidHex(cs?.accentColor) ? cs.accentColor : DEFAULT_ACCENT,
      themePreset: isValidPreset(cs?.themePreset) ? cs.themePreset : DEFAULT_PRESET,
      logoPath: cs?.logoPath ?? null,
    };
  } catch {
    return { companyName: null, accentColor: DEFAULT_ACCENT, themePreset: DEFAULT_PRESET, logoPath: null };
  }
}
