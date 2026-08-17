import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { needsSetup } from "@/lib/setup";
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

export default async function LandingPage() {
  // Marketing landing only exists on demo instances. A real install goes
  // straight to setup (empty DB) or to the app/login.
  if (process.env.DEMO !== "1") {
    if (await needsSetup()) redirect("/setup");
    const session = await auth();
    redirect(session?.user ? "/dashboard" : "/login");
  }

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
