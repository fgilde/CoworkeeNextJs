import { getTranslations, getLocale } from "next-intl/server";
import { requireAuth } from "@/lib/rbac";
import { db } from "@/lib/db";
import type { Locale } from "@/i18n/locales";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LocaleSwitch } from "@/components/locale-switch";
import { AccountForm } from "@/components/account/account-form";
import { PasswordForm } from "@/components/account/password-form";

export default async function AccountPage() {
  const session = await requireAuth();
  const t = await getTranslations("account");
  const tLocale = await getTranslations("locale");
  const locale = await getLocale();

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      email: true,
      employee: {
        select: {
          firstName: true,
          lastName: true,
          phone: true,
          street: true,
          city: true,
          country: true,
          department: { select: { name: true } },
          position: { select: { title: true } },
        },
      },
    },
  });
  const employee = user?.employee ?? null;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t("myData")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <div>
              <div className="text-muted-foreground">{t("name")}</div>
              <div>{employee ? `${employee.firstName} ${employee.lastName}` : "—"}</div>
            </div>
            <div>
              <div className="text-muted-foreground">{t("email")}</div>
              <div>{user?.email}</div>
            </div>
            {employee && (
              <>
                <div>
                  <div className="text-muted-foreground">{t("department")}</div>
                  <div>{employee.department?.name ?? "—"}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">{t("position")}</div>
                  <div>{employee.position?.title ?? "—"}</div>
                </div>
              </>
            )}
          </div>

          {employee ? (
            <AccountForm initial={employee} />
          ) : (
            <p className="text-sm text-muted-foreground">{t("noEmployee")}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("password")}</CardTitle>
        </CardHeader>
        <CardContent>
          <PasswordForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("language")}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">{t("currentLanguage", { lang: tLocale(locale as Locale) })}</span>
          <LocaleSwitch />
        </CardContent>
      </Card>
    </div>
  );
}
