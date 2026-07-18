import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SetupWizard } from "@/components/setup-wizard";
import { needsSetup } from "@/lib/setup";

export default async function SetupPage() {
  if (!(await needsSetup())) redirect("/login");

  const t = await getTranslations("setup");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6 sm:p-10">
      <span className="font-heading text-2xl font-semibold tracking-tight">Coworkee</span>

      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{t("title")}</CardTitle>
            <CardDescription>{t("description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <SetupWizard />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
