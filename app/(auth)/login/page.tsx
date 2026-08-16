import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { LayoutGrid, Languages, ShieldCheck, Server, type LucideIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/login-form";
import { needsSetup } from "@/lib/setup";
import { VERSION_LABEL } from "@/lib/version";
import { getBranding } from "@/lib/branding";

const BULLETS: { key: string; icon: LucideIcon }[] = [
  { key: "allInOne", icon: LayoutGrid },
  { key: "bilingual", icon: Languages },
  { key: "roles", icon: ShieldCheck },
  { key: "selfHosted", icon: Server },
];

export default async function LoginPage() {
  if (await needsSetup()) redirect("/setup");

  const t = await getTranslations("auth");
  const branding = await getBranding();

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel — hidden on mobile, shown from lg breakpoint up. */}
      <div className="login-aurora relative hidden flex-col justify-between overflow-hidden bg-linear-to-br from-indigo-700 via-primary to-violet-700 p-12 text-white lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -left-24 size-96 animate-pulse rounded-full bg-white/10 blur-3xl [animation-duration:8s]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 bottom-0 size-[28rem] animate-pulse rounded-full bg-violet-300/20 blur-3xl [animation-duration:11s]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] bg-size-[2.5rem_2.5rem] opacity-[0.07]"
        />

        <span className="relative font-heading text-2xl font-semibold tracking-tight">Coworkee</span>

        <div className="relative flex max-w-md flex-col gap-8">
          <div className="flex flex-col gap-4">
            <h1 className="text-4xl font-semibold tracking-tight text-balance">{t("tagline")}</h1>
            <p className="text-lg text-white/80">{t("taglineBody")}</p>
          </div>
          <ul className="flex flex-col gap-4">
            {BULLETS.map(({ key, icon: Icon }) => (
              <li key={key} className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15 backdrop-blur-sm">
                  <Icon className="size-4.5" aria-hidden />
                </span>
                <span className="flex flex-col">
                  <span className="font-medium">{t(`bullets.${key}.title`)}</span>
                  <span className="text-sm text-white/70">{t(`bullets.${key}.desc`)}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/60">© {new Date().getFullYear()} Coworkee</p>
      </div>

      {/* Form panel */}
      <div className="flex flex-col items-center justify-center gap-6 p-6 sm:p-10">
        {branding.logoPath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src="/api/branding/logo" alt={branding.companyName ?? "Coworkee"} className="h-10 w-auto max-w-[220px] object-contain" />
        ) : (
          <span className="font-heading text-2xl font-semibold tracking-tight lg:hidden">Coworkee</span>
        )}

        <div className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">{t("loginTitle")}</CardTitle>
              <CardDescription>{t("welcome")}</CardDescription>
            </CardHeader>
            <CardContent>
              <LoginForm showDemo={process.env.DEMO === "1"} />
            </CardContent>
          </Card>
          <p className="mt-6 text-center text-xs text-muted-foreground" aria-label={t("versionAria")}>
            {VERSION_LABEL}
          </p>
        </div>
      </div>
    </div>
  );
}
