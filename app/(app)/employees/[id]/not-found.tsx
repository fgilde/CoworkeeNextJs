import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { buttonVariants } from "@/components/ui/button";

export default async function EmployeeNotFound() {
  const t = await getTranslations("employees");

  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <h1 className="text-xl font-semibold">{t("notFoundTitle")}</h1>
      <p className="text-sm text-muted-foreground">{t("notFoundDescription")}</p>
      <Link href="/employees" className={buttonVariants({ size: "sm" })}>
        {t("backToList")}
      </Link>
    </div>
  );
}
