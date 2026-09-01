import { getTranslations, getLocale } from "next-intl/server";
import { requireAuth, can } from "@/lib/rbac";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { CreateCompForm, DeleteCompButton } from "@/components/compensation/compensation-forms";

function formatMoney(amountCents: number, currency: string, locale: string): string {
  return (amountCents / 100).toLocaleString(locale, { style: "currency", currency });
}

export default async function CompensationPage() {
  const session = await requireAuth();
  const t = await getTranslations("compensation");
  const locale = await getLocale();
  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { employeeId: true },
  });
  const employeeId = user?.employeeId ?? null;
  const canManage = can(session.user.role, "compensation:manage");

  const header = <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>;

  // ---- My compensation (everyone with an employeeId) ----
  const myRecords = employeeId
    ? await db.compensationRecord.findMany({
        where: { employeeId },
        orderBy: { effectiveDate: "desc" },
      })
    : [];
  const current = myRecords[0] ?? null;

  const mySection = (
    <section className="flex flex-col gap-3">
      <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {t("myCompensation")}
      </h2>
      {!employeeId ? (
        <Card>
          <CardContent className="text-sm text-muted-foreground">{t("noEmployee")}</CardContent>
        </Card>
      ) : !current ? (
        <Card>
          <CardContent className="text-sm text-muted-foreground">{t("noCompYet")}</CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="flex flex-col gap-1">
              <span className="text-2xl font-semibold tracking-tight">
                {formatMoney(current.amountCents, current.currency, locale)}
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  {t(`frequency.${current.frequency}`)}
                </span>
              </span>
              <span className="text-xs text-muted-foreground">
                {t("effectiveDate")}: {dateFormatter.format(current.effectiveDate)}
              </span>
            </CardContent>
          </Card>
          {myRecords.length > 1 && (
            <div className="flex flex-col gap-2">
              {myRecords.slice(1).map((r) => (
                <Card key={r.id}>
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 text-sm">
                    <span className="font-medium">
                      {formatMoney(r.amountCents, r.currency, locale)}{" "}
                      <span className="text-muted-foreground">· {t(`frequency.${r.frequency}`)}</span>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {dateFormatter.format(r.effectiveDate)}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );

  if (!canManage) {
    return (
      <div className="flex flex-col gap-8">
        {header}
        {mySection}
      </div>
    );
  }

  // ---- Manage compensation (HR/ADMIN) ----
  const employees = await db.employee.findMany({
    select: { id: true, firstName: true, lastName: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
  const employeeOptions = employees.map((e) => ({ id: e.id, name: `${e.firstName} ${e.lastName}` }));

  const recent = await db.compensationRecord.findMany({
    take: 50,
    orderBy: { createdAt: "desc" },
    include: { employee: { select: { firstName: true, lastName: true } } },
  });

  return (
    <div className="flex flex-col gap-8">
      {header}
      {mySection}

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold tracking-tight">{t("manageCompensation")}</h2>
        <CreateCompForm employees={employeeOptions} />
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noRecords")}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {recent.map((r) => (
              <Card key={r.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">
                      {r.employee.firstName} {r.employee.lastName}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      · {formatMoney(r.amountCents, r.currency, locale)} · {t(`frequency.${r.frequency}`)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      · {dateFormatter.format(r.effectiveDate)}
                    </span>
                  </div>
                  <DeleteCompButton id={r.id} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
