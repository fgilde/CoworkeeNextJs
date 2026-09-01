import { getTranslations } from "next-intl/server";
import { requireAuth, can } from "@/lib/rbac";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EnrollToggle, NewBenefitForm, BenefitControls } from "@/components/benefits/benefit-forms";

export default async function BenefitsPage() {
  const session = await requireAuth();
  const t = await getTranslations("benefits");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { employeeId: true },
  });
  const employeeId = user?.employeeId ?? null;

  const canManage = can(session.user.role, "benefit:manage");

  const header = <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>;

  const activeBenefits = await db.benefit.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });

  const myEnrollments = employeeId
    ? await db.benefitEnrollment.findMany({ where: { employeeId }, select: { benefitId: true } })
    : [];
  const enrolledIds = new Set(myEnrollments.map((e) => e.benefitId));

  return (
    <div className="flex flex-col gap-8">
      {header}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight">{t("availableBenefits")}</h2>
        {activeBenefits.length === 0 ? (
          <Card>
            <CardContent className="text-sm text-muted-foreground">{t("noBenefits")}</CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {activeBenefits.map((benefit) => (
              <Card key={benefit.id}>
                <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{benefit.name}</span>
                      {benefit.category && (
                        <Badge variant="secondary">{benefit.category}</Badge>
                      )}
                    </div>
                    {benefit.description && (
                      <p className="text-sm text-muted-foreground">{benefit.description}</p>
                    )}
                  </div>
                  {employeeId ? (
                    <EnrollToggle benefitId={benefit.id} enrolled={enrolledIds.has(benefit.id)} />
                  ) : (
                    <span className="text-sm text-muted-foreground">{t("noEmployee")}</span>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {canManage && <ManageSection />}
    </div>
  );
}

async function ManageSection() {
  const t = await getTranslations("benefits");

  const benefits = await db.benefit.findMany({
    orderBy: [{ active: "desc" }, { name: "asc" }],
    include: { _count: { select: { enrollments: true } } },
  });

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold tracking-tight">{t("manageBenefits")}</h2>
      <NewBenefitForm />
      {benefits.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noBenefits")}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {benefits.map((benefit) => (
            <Card key={benefit.id}>
              <CardContent className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{benefit.name}</span>
                    {benefit.category && (
                      <span className="text-sm text-muted-foreground">· {benefit.category}</span>
                    )}
                    <Badge variant={benefit.active ? "secondary" : "outline"}>
                      {benefit.active ? t("active") : t("inactive")}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {t("enrollmentCount", { count: benefit._count.enrollments })}
                    </span>
                  </div>
                  <BenefitControls
                    benefit={{
                      id: benefit.id,
                      name: benefit.name,
                      description: benefit.description,
                      category: benefit.category,
                      active: benefit.active,
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
