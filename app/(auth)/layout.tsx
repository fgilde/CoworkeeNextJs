import { getTranslations } from "next-intl/server";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("common");

  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center gap-8 p-4">
      <span className="font-heading text-2xl font-semibold tracking-tight">{t("appName")}</span>
      {children}
    </div>
  );
}
