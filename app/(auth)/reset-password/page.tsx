import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResetPasswordForm } from "@/components/reset-password-form";
import { getBranding } from "@/lib/branding";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const t = await getTranslations("auth");
  const branding = await getBranding();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6 sm:p-10">
      {branding.logoPath ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/api/branding/logo" alt={branding.companyName ?? "Coworkee"} className="h-10 w-auto max-w-[220px] object-contain" />
      ) : (
        <div className="flex items-center gap-2">
          <Image src="/icon.png" alt={branding.companyName ?? "Coworkee"} width={32} height={32} className="rounded-lg" />
          <span className="font-heading text-2xl font-semibold tracking-tight">Coworkee</span>
        </div>
      )}
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{t("reset.title")}</CardTitle>
            <CardDescription>{t("reset.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            {token ? (
              <ResetPasswordForm token={token} />
            ) : (
              <div className="flex flex-col gap-4">
                <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
                  {t("reset.errors.invalidOrExpired")}
                </p>
                <Link href="/forgot-password" className="text-sm text-primary underline underline-offset-2">
                  {t("reset.requestNew")}
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
