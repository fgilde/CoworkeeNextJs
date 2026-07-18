import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  ArrowRight,
  BarChart3,
  Bell,
  Briefcase,
  CalendarClock,
  Check,
  Clock,
  Cloud,
  FileText,
  ListChecks,
  Mail,
  Moon,
  Network,
  Server,
  ShieldCheck,
  Sun,
  Target,
  Users2,
} from "lucide-react";
import { BrowserFrame } from "@/components/marketing/browser-frame";

const CONTACT_EMAIL = "info@coworkee.de";
const GITHUB_REPO_URL = "https://github.com/fgilde/CoworkeeNextJs";

const trustKeys = ["modules", "languages", "theme", "rbac", "hosting"] as const;

const moduleItems = [
  { key: "employees", icon: Users2 },
  { key: "absences", icon: CalendarClock },
  { key: "time", icon: Clock },
  { key: "documents", icon: FileText },
  { key: "onboarding", icon: ListChecks },
  { key: "performance", icon: Target },
  { key: "analytics", icon: BarChart3 },
  { key: "recruiting", icon: Briefcase },
  { key: "news", icon: Bell },
] as const;

const spotlightItems = [
  { key: "analytics", src: "/marketing/screens/analytics-light.png" },
  { key: "orgChart", src: "/marketing/screens/org-light.png" },
  { key: "recruiting", src: "/marketing/screens/recruiting-light.png" },
  { key: "absences", src: "/marketing/screens/absences-light.png" },
  { key: "employees", src: "/marketing/screens/employees-light.png" },
] as const;

const demoLogins = [
  { roleKey: "admin", email: "admin@coworkee.test" },
  { roleKey: "hr", email: "hr@coworkee.test" },
  { roleKey: "manager", email: "manager@coworkee.test" },
  { roleKey: "employee", email: "employee@coworkee.test" },
] as const;

export async function Hero() {
  const t = await getTranslations("marketing");

  return (
    <section className="relative overflow-hidden bg-linear-to-br from-indigo-700 via-indigo-600 to-violet-700 pt-20 pb-28 text-white sm:pt-28">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-32 size-96 rounded-full bg-white/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/3 -right-40 size-[32rem] rounded-full bg-violet-400/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] bg-size-[2.5rem_2.5rem] opacity-[0.06]"
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            {t("hero.title")}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-indigo-100 text-balance">{t("hero.subtitle")}</p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-indigo-700 shadow-lg transition-all hover:shadow-xl hover:brightness-105 active:translate-y-px"
            >
              {t("hero.ctaPrimary")}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <a
              href="#funktionen"
              className="inline-flex items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
            >
              {t("hero.ctaSecondary")}
            </a>
          </div>
        </div>

        <div className="relative mx-auto mt-16 max-w-4xl">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 scale-95 rounded-3xl bg-white/20 blur-2xl"
          />
          <div className="rotate-1 transition-transform duration-500 ease-out hover:rotate-0">
            <BrowserFrame
              src="/marketing/screens/dashboard-light.png"
              alt={t("hero.screenshotAlt")}
              url="coworkee.app/dashboard"
              preload
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export async function TrustBand() {
  const t = await getTranslations("marketing");

  return (
    <section className="border-b border-slate-200 bg-white py-8">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-4 sm:px-6">
        {trustKeys.map((key) => (
          <div key={key} className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <ShieldCheck className="size-4 text-indigo-500" aria-hidden />
            {t(`trust.${key}`)}
          </div>
        ))}
      </div>
    </section>
  );
}

export async function ModuleGrid() {
  const t = await getTranslations("marketing");

  return (
    <section id="module" className="bg-slate-50 py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            {t("modules.heading")}
          </h2>
          <p className="mt-4 text-slate-600">{t("modules.subheading")}</p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {moduleItems.map(({ key, icon: Icon }) => (
            <div
              key={key}
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="inline-flex size-11 items-center justify-center rounded-xl bg-linear-to-br from-indigo-600 to-violet-600 text-white">
                <Icon className="size-5" aria-hidden />
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">{t(`modules.items.${key}.title`)}</h3>
              <p className="mt-1.5 text-sm text-slate-600">{t(`modules.items.${key}.body`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export async function FeatureSpotlights() {
  const t = await getTranslations("marketing");

  return (
    <section id="funktionen" className="bg-white py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            {t("spotlights.heading")}
          </h2>
        </div>

        <div className="mt-16 flex flex-col gap-24">
          {spotlightItems.map(({ key, src }, i) => {
            const bullets = t.raw(`spotlights.${key}.bullets`) as string[];
            return (
              <div key={key} className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
                <div className={i % 2 === 1 ? "lg:order-2" : undefined}>
                  <span className="text-sm font-semibold tracking-wide text-indigo-600 uppercase">
                    {t(`spotlights.${key}.eyebrow`)}
                  </span>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                    {t(`spotlights.${key}.title`)}
                  </h3>
                  <p className="mt-4 text-slate-600">{t(`spotlights.${key}.body`)}</p>
                  <ul className="mt-6 flex flex-col gap-3">
                    {bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2.5 text-sm text-slate-700">
                        <Check className="mt-0.5 size-4 shrink-0 text-indigo-600" aria-hidden />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={i % 2 === 1 ? "lg:order-1" : undefined}>
                  <BrowserFrame src={src} alt={t(`spotlights.${key}.alt`)} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export async function DarkModeShowcase() {
  const t = await getTranslations("marketing");

  return (
    <section className="bg-slate-950 py-24 text-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
            <Sun className="size-3.5" aria-hidden />
            <Moon className="size-3.5" aria-hidden />
            {t("darkMode.badge")}
          </div>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">{t("darkMode.heading")}</h2>
          <p className="mt-4 text-slate-300">{t("darkMode.body")}</p>
        </div>

        <div className="mt-14 grid gap-8 sm:grid-cols-2">
          <div>
            <BrowserFrame
              src="/marketing/screens/dashboard-light.png"
              alt={t("darkMode.lightAlt")}
              className="ring-1 ring-white/10"
            />
            <p className="mt-3 text-center text-sm text-slate-400">{t("darkMode.lightLabel")}</p>
          </div>
          <div>
            <BrowserFrame
              src="/marketing/screens/dashboard-dark.png"
              alt={t("darkMode.darkAlt")}
              className="ring-1 ring-white/10"
            />
            <p className="mt-3 text-center text-sm text-slate-400">{t("darkMode.darkLabel")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export async function HostingSection() {
  const t = await getTranslations("marketing");
  const selfHostBullets = t.raw("hosting.selfHost.bullets") as string[];
  const managedBullets = t.raw("hosting.managed.bullets") as string[];

  return (
    <section id="hosting" className="bg-slate-50 py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            {t("hosting.heading")}
          </h2>
          <p className="mt-4 text-slate-600">{t("hosting.subheading")}</p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="inline-flex size-11 items-center justify-center rounded-xl bg-linear-to-br from-indigo-600 to-violet-600 text-white">
              <Server className="size-5" aria-hidden />
            </div>
            <h3 className="mt-4 text-xl font-semibold text-slate-900">{t("hosting.selfHost.title")}</h3>
            <p className="mt-2 text-sm text-slate-600">{t("hosting.selfHost.body")}</p>
            <ul className="mt-6 flex flex-col gap-3">
              {selfHostBullets.map((b) => (
                <li key={b} className="flex items-start gap-2.5 text-sm text-slate-700">
                  <Check className="mt-0.5 size-4 shrink-0 text-indigo-600" aria-hidden />
                  {b}
                </li>
              ))}
            </ul>
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100"
            >
              {t("hosting.selfHost.cta")}
              <ArrowRight className="size-4" aria-hidden />
            </a>
          </div>

          <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="inline-flex size-11 items-center justify-center rounded-xl bg-linear-to-br from-indigo-600 to-violet-600 text-white">
              <Cloud className="size-5" aria-hidden />
            </div>
            <h3 className="mt-4 text-xl font-semibold text-slate-900">{t("hosting.managed.title")}</h3>
            <p className="mt-2 text-sm text-slate-600">{t("hosting.managed.body")}</p>
            <ul className="mt-6 flex flex-col gap-3">
              {managedBullets.map((b) => (
                <li key={b} className="flex items-start gap-2.5 text-sm text-slate-700">
                  <Check className="mt-0.5 size-4 shrink-0 text-indigo-600" aria-hidden />
                  {b}
                </li>
              ))}
            </ul>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-lg bg-linear-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md hover:brightness-110"
            >
              <Mail className="size-4" aria-hidden />
              {t("hosting.managed.cta")}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export async function DemoSection() {
  const t = await getTranslations("marketing");

  return (
    <section id="demo" className="bg-linear-to-br from-indigo-700 via-indigo-600 to-violet-700 py-24 text-white">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="overflow-hidden rounded-3xl bg-white/10 p-8 backdrop-blur-sm ring-1 ring-white/20 sm:p-12">
          <div className="text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t("demo.heading")}</h2>
            <p className="mt-3 text-indigo-100">{t("demo.body")}</p>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            {demoLogins.map((d) => (
              <div
                key={d.email}
                className="flex items-center justify-between gap-4 rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/15"
              >
                <span className="text-sm font-medium text-white/90">{t(`demo.roles.${d.roleKey}`)}</span>
                <code className="text-sm text-indigo-100">{d.email}</code>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-sm text-indigo-100">
            {t("demo.passwordLabel")} <code className="rounded bg-white/15 px-1.5 py-0.5">coworkee</code>
          </p>

          <div className="mt-8 flex justify-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-8 py-3 text-sm font-semibold text-indigo-700 shadow-lg transition-all hover:shadow-xl hover:brightness-105 active:translate-y-px"
            >
              {t("demo.cta")}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export async function ContactSection() {
  const t = await getTranslations("marketing");

  return (
    <section id="kontakt" className="bg-white py-24">
      <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
        <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">{t("contact.heading")}</h2>
        <p className="mt-4 text-slate-600">{t("contact.body")}</p>
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-linear-to-r from-indigo-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md hover:brightness-110 active:translate-y-px"
        >
          <Mail className="size-4" aria-hidden />
          {t("contact.cta")}
        </a>
        <p className="mt-3 text-sm text-slate-500">{CONTACT_EMAIL}</p>
      </div>
    </section>
  );
}

export async function MarketingFooter() {
  const t = await getTranslations("marketing");

  const footerLinks = [
    { href: "#module", label: t("nav.modules") },
    { href: "#funktionen", label: t("nav.features") },
    { href: "#hosting", label: t("nav.hosting") },
    { href: "#demo", label: t("nav.demo") },
    { href: "#kontakt", label: t("nav.contact") },
  ];

  return (
    <footer className="bg-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-10 sm:flex-row sm:justify-between sm:px-6">
        <span className="font-heading text-lg font-semibold tracking-tight text-slate-900">Coworkee</span>

        <nav className="flex flex-wrap items-center justify-center gap-6">
          {footerLinks.map((l) => (
            <a key={l.href} href={l.href} className="text-sm text-slate-600 hover:text-slate-900">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="text-center text-sm text-slate-500 sm:text-right">
          <p>
            © 2026 Coworkee · {t("footer.by")}{" "}
            <a
              href="https://www.gilde.org"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
            >
              gilde.org
            </a>
          </p>
          <p className="mt-0.5 flex items-center justify-center gap-1 sm:justify-end">
            <Network className="size-3.5" aria-hidden />
            {t("footer.demoInstance")}
          </p>
        </div>
      </div>
    </footer>
  );
}
