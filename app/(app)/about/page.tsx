import Image from "next/image";
import { getTranslations, getLocale } from "next-intl/server";
import { requireAuth } from "@/lib/rbac";
import { getBranding } from "@/lib/branding";
import { VERSION_LABEL } from "@/lib/version";
import { Card, CardContent } from "@/components/ui/card";
import { GildeWidget } from "@/components/gilde-widget";

export default async function AboutPage() {
  await requireAuth();
  const t = await getTranslations("about");
  const locale = await getLocale();
  const branding = await getBranding();
  const accent = branding.accentColor;
  const appName = branding.companyName || "Coworkee";

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          {branding.logoPath ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/api/branding/logo" alt={appName} className="max-h-10 w-auto max-w-[180px] object-contain" />
          ) : (
            <Image src="/icon.png" alt={appName} width={40} height={40} className="rounded-xl" />
          )}
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
        </div>
        <p className="max-w-2xl text-sm text-muted-foreground">{t("tagline")}</p>
        <p className="text-xs text-muted-foreground">
          {t("version")}: <span className="font-mono">{VERSION_LABEL}</span>
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold tracking-tight">{t("contactHeading")}</h2>
          <Card>
            <CardContent>
              <GildeWidget
                type="contact"
                accent={accent}
                language={locale}
                inline
                showHomepage
                title={t("contactHeading")}
              />
            </CardContent>
          </Card>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold tracking-tight">{t("supportHeading")}</h2>
          <Card>
            <CardContent>
              <GildeWidget
                type="support"
                accent={accent}
                language={locale}
                inline
                showHomepage
                title={t("supportHeading")}
              />
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
