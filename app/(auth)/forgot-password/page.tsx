import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { getBranding } from "@/lib/branding";

export default async function ForgotPasswordPage() {
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
            <CardTitle className="text-xl">{t("forgot.title")}</CardTitle>
            <CardDescription>{t("forgot.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ForgotPasswordForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
