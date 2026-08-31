import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireAuth, can } from "@/lib/rbac";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  SurveyMetaForm,
  AddQuestionForm,
  DeleteQuestionButton,
  OpenSurveyButton,
  CloseSurveyButton,
  DeleteSurveyButton,
  RespondForm,
  SURVEY_STATUS_KEY,
} from "@/components/surveys/survey-forms";

export default async function SurveyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireAuth();
  const t = await getTranslations("surveys");
  const canManage = can(session.user.role, "survey:manage");

  const survey = await db.survey.findUnique({
    where: { id },
    include: { questions: { orderBy: { order: "asc" } }, _count: { select: { participations: true } } },
  });
  if (!survey) notFound();

  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { employeeId: true } });
  const employeeId = user?.employeeId ?? null;

  const heading = (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{survey.title}</h1>
        <Badge variant="secondary">{t(SURVEY_STATUS_KEY[survey.status])}</Badge>
        {survey.anonymous && <Badge variant="secondary">{t("anonymous")}</Badge>}
      </div>
      {survey.description && <p className="text-sm text-muted-foreground">{survey.description}</p>}
    </div>
  );

  // ---- Employee responding view ----
  if (!canManage) {
    if (!employeeId) return wrap(heading, <Card><CardContent className="text-sm text-muted-foreground">{t("noEmployee")}</CardContent></Card>);
    if (survey.status !== "OPEN")
      return wrap(heading, <Card><CardContent className="text-sm text-muted-foreground">{t("notAvailable")}</CardContent></Card>);
    const done = await db.surveyParticipation.findUnique({
      where: { surveyId_employeeId: { surveyId: id, employeeId } },
    });
    if (done)
      return wrap(heading, <Card><CardContent className="text-sm text-muted-foreground">{t("thanksResponded")}</CardContent></Card>);
    return wrap(
      heading,
      <Card>
        <CardContent>
          <RespondForm surveyId={id} questions={survey.questions.map((q) => ({ id: q.id, type: q.type, prompt: q.prompt, required: q.required }))} />
        </CardContent>
      </Card>
    );
  }

  // ---- Manager/HR/ADMIN view ----
  const isDraft = survey.status === "DRAFT";
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {heading}
        <div className="flex items-center gap-2">
          {survey.status !== "DRAFT" && (
            <Link href={`/surveys/${id}/results`} className={buttonVariants({ variant: "outline", size: "sm" })}>
              {t("results")}
            </Link>
          )}
          <Link href="/surveys" className={buttonVariants({ variant: "outline", size: "sm" })}>
            {t("back")}
          </Link>
        </div>
      </div>

      {isDraft && (
        <Card>
          <CardContent>
            <SurveyMetaForm survey={{ id: survey.id, title: survey.title, description: survey.description, anonymous: survey.anonymous }} />
          </CardContent>
        </Card>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight">{t("questions")}</h2>
        {survey.questions.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noQuestionsYet")}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {survey.questions.map((q, i) => (
              <Card key={q.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-muted-foreground">{i + 1}.</span>
                    <Badge variant="secondary">{t(`qtype.${q.type}`)}</Badge>
                    <span className="font-medium">{q.prompt}</span>
                    {q.required && <span className="text-xs text-destructive">{t("required")}</span>}
                  </div>
                  {isDraft && <DeleteQuestionButton id={q.id} />}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        {isDraft && <AddQuestionForm surveyId={id} />}
      </section>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">{t("responseCount", { count: survey._count.participations })}</span>
          <div className="flex items-center gap-2">
            {isDraft && <OpenSurveyButton id={id} />}
            {survey.status === "OPEN" && <CloseSurveyButton id={id} />}
            <DeleteSurveyButton id={id} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function wrap(heading: React.ReactNode, body: React.ReactNode) {
  return (
    <div className="flex flex-col gap-6">
      {heading}
      {body}
    </div>
  );
}
