import type { Metadata } from "next";
import { MarketingNav } from "@/components/marketing/nav";
import {
  Hero,
  TrustBand,
  ModuleGrid,
  FeatureSpotlights,
  DarkModeShowcase,
  DemoSection,
  MarketingFooter,
} from "@/components/marketing/sections";

// Public marketing landing page at "/". Deliberately self-contained: no
// next-intl, no theme-provider dependency — see auth.config.ts, which
// carves out "/" as the one route middleware never redirects to /login.
export const metadata: Metadata = {
  title: "Coworkee — Die HR-Plattform für dein ganzes Team",
  description:
    "Mitarbeiterverwaltung, Abwesenheit, Zeiterfassung, Dokumente, Performance und Recruiting in einer Plattform.",
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <MarketingNav />
      <main>
        <Hero />
        <TrustBand />
        <ModuleGrid />
        <FeatureSpotlights />
        <DarkModeShowcase />
        <DemoSection />
      </main>
      <MarketingFooter />
    </div>
  );
}
