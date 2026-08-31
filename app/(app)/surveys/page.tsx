import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { requireAuth, can } from "@/lib/rbac";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { NewSurveyForm, SURVEY_STATUS_KEY } from "@/components/surveys/survey-forms";

const STATUS_STYLES: Record<string, string | undefined> = {
  OPEN: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  CLOSED: "bg-muted text-muted-foreground",
};

export default async function SurveysPage() {
  const session = await requireAuth();
  const t = await getTranslations("surveys");
  const locale = await getLocale();
  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
  const canManage = can(session.user.role, "survey:manage");

  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { employeeId: true } });
  const employeeId = user?.employeeId ?? null;
  const header = <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>;

  const openSurveys = await db.survey.findMany({
    where: { status: "OPEN" },
    select: { id: true, title: true, description: true },
    orderBy: { createdAt: "desc" },
  });
  const myParticipations = employeeId
    ? await db.surveyParticipation.findMany({
        where: { employeeId, surveyId: { in: openSurveys.map((s) => s.id) } },
        select: { surveyId: true },
      })
    : [];
  const doneSet = new Set(myParticipations.map((p) => p.surveyId));

  const openSection = (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold tracking-tight">{t("openSurveys")}</h2>
      {openSurveys.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noOpenSurveys")}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {openSurveys.map((s) => (
            <Card key={s.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <Link href={`/surveys/${s.id}`} className="font-medium text-primary hover:underline">
                    {s.title}
                  </Link>
                  {s.description && <p className="text-sm text-muted-foreground">{s.description}</p>}
                </div>
                {doneSet.has(s.id) ? (
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                    {t("responded")}
                  </Badge>
                ) : (
                  <Link href={`/surveys/${s.id}`} className={buttonVariants({ size: "sm" })}>
                    {t("respond")}
                  </Link>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );

  if (!canManage) {
    return (
      <div className="flex flex-col gap-8">
        {header}
        {openSection}
      </div>
    );
  }

  const allSurveys = await db.survey.findMany({
    include: { _count: { select: { questions: true, participations: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-8">
      {header}
      {openSection}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight">{t("newSurvey")}</h2>
        <NewSurveyForm />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight">{t("allSurveys")}</h2>
        {allSurveys.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noSurveys")}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {allSurveys.map((s) => (
              <Card key={s.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/surveys/${s.id}`} className="font-medium text-primary hover:underline">
                        {s.title}
                      </Link>
                      <Badge variant="secondary" className={STATUS_STYLES[s.status]}>
                        {t(SURVEY_STATUS_KEY[s.status])}
                      </Badge>
                      {s.anonymous && <Badge variant="secondary">{t("anonymous")}</Badge>}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {t("questionCount", { count: s._count.questions })} ·{" "}
                      {t("responseCount", { count: s._count.participations })} · {dateFormatter.format(s.createdAt)}
                    </span>
                  </div>
                  {s.status !== "DRAFT" && (
                    <Link href={`/surveys/${s.id}/results`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                      {t("results")}
                    </Link>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
