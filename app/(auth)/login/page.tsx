import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Users2, CalendarClock, Target } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/login-form";
import { needsSetup } from "@/lib/setup";

export default async function LoginPage() {
  if (await needsSetup()) redirect("/setup");

  const t = await getTranslations("auth");

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel — hidden on mobile, shown from lg breakpoint up. */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-linear-to-br from-indigo-600 via-primary to-violet-700 p-12 text-white lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -left-24 size-96 rounded-full bg-white/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 bottom-0 size-[28rem] rounded-full bg-violet-400/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] bg-size-[2.5rem_2.5rem] opacity-[0.07]"
        />

        <span className="relative font-heading text-2xl font-semibold tracking-tight">Coworkee</span>

        <div className="relative flex max-w-md flex-col gap-6">
          <h1 className="text-3xl font-semibold tracking-tight text-balance">{t("tagline")}</h1>
          <p className="text-white/80">{t("taglineBody")}</p>
          <div className="flex flex-col gap-3 text-sm text-white/90">
            <div className="flex items-center gap-3">
              <Users2 className="size-4 shrink-0" aria-hidden />
              <span>{t("demo.roles.hr")}</span>
            </div>
            <div className="flex items-center gap-3">
              <CalendarClock className="size-4 shrink-0" aria-hidden />
              <span>{t("demo.roles.manager")}</span>
            </div>
            <div className="flex items-center gap-3">
              <Target className="size-4 shrink-0" aria-hidden />
              <span>{t("demo.roles.employee")}</span>
            </div>
          </div>
        </div>

        <p className="relative text-xs text-white/60">© {new Date().getFullYear()} Coworkee</p>
      </div>

      {/* Form panel */}
      <div className="flex flex-col items-center justify-center gap-6 p-6 sm:p-10">
        <span className="font-heading text-2xl font-semibold tracking-tight lg:hidden">Coworkee</span>

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
        </div>
      </div>
    </div>
  );
}
