import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  NewPlanForm,
  AddCandidateForm,
  DeletePlanButton,
  RemoveCandidateButton,
  READINESS_KEY,
} from "@/components/skills/succession-forms";

const READINESS_STYLES: Record<string, string | undefined> = {
  READY_NOW: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  THREE_PLUS_YEARS: "bg-muted text-muted-foreground",
};

export default async function SuccessionPage() {
  await requireRole("HR", "ADMIN");
  const t = await getTranslations("succession");

  const [employees, plans] = await Promise.all([
    db.employee.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, firstName: true, lastName: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
    db.successionPlan.findMany({
      include: {
        roleHolder: { select: { id: true, firstName: true, lastName: true } },
        candidates: {
          include: { candidate: { select: { firstName: true, lastName: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  const options = employees.map((e) => ({ id: e.id, name: `${e.firstName} ${e.lastName}` }));

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
        <Link href="/skills" className={buttonVariants({ variant: "outline", size: "sm" })}>
          {t("backToSkills")}
        </Link>
      </div>
      <p className="max-w-2xl text-sm text-muted-foreground">{t("intro")}</p>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight">{t("newPlan")}</h2>
        <NewPlanForm employees={options} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight">{t("plans")}</h2>
        {plans.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noPlans")}</p>
        ) : (
          <div className="flex flex-col gap-4">
            {plans.map((plan) => {
              const takenIds = new Set([plan.roleHolderId, ...plan.candidates.map((c) => c.candidateId)]);
              const candidateOptions = options.filter((o) => !takenIds.has(o.id));
              return (
                <Card key={plan.id}>
                  <CardContent className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">
                          {plan.roleHolder.firstName} {plan.roleHolder.lastName}
                        </span>
                        {plan.notes && <p className="text-sm text-muted-foreground">{plan.notes}</p>}
                      </div>
                      <DeletePlanButton id={plan.id} />
                    </div>

                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t("candidates")}</span>
                      {plan.candidates.length === 0 ? (
                        <p className="text-sm text-muted-foreground">{t("noCandidates")}</p>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {plan.candidates.map((c) => (
                            <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 p-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-medium">
                                  {c.candidate.firstName} {c.candidate.lastName}
                                </span>
                                <Badge variant="secondary" className={READINESS_STYLES[c.readiness]}>
                                  {t(READINESS_KEY[c.readiness])}
                                </Badge>
                                {c.notes && <span className="text-sm text-muted-foreground">· {c.notes}</span>}
                              </div>
                              <RemoveCandidateButton id={c.id} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <AddCandidateForm planId={plan.id} candidates={candidateOptions} />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
