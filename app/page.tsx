import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { MarketingNav } from "@/components/marketing/nav";
import {
  Hero,
  TrustBand,
  StatsBand,
  HowItWorks,
  ModuleGrid,
  WhyCoworkee,
  FeatureSpotlights,
  DarkModeShowcase,
  HostingSection,
  Faq,
  DemoSection,
  ContactSection,
  MarketingFooter,
  RevealInit,
} from "@/components/marketing/sections";

// Public marketing landing page at "/". No theme-provider dependency here,
// but it does use next-intl (bilingual DE/EN copy, see messages/*.json under
// "marketing") — see auth.config.ts, which carves out "/" as the one route
// middleware never redirects to /login.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("marketing");
  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <RevealInit />
      <MarketingNav />
      <main>
        <Hero />
        <TrustBand />
        <StatsBand />
        <HowItWorks />
        <ModuleGrid />
        <WhyCoworkee />
        <FeatureSpotlights />
        <DarkModeShowcase />
        <HostingSection />
        <Faq />
        <DemoSection />
        <ContactSection />
      </main>
      <MarketingFooter />
    </div>
  );
}
