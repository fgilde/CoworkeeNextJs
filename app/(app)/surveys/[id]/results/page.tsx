import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireAuth, can } from "@/lib/rbac";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { SURVEY_STATUS_KEY } from "@/components/surveys/survey-forms";

function Bar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-20 shrink-0 text-muted-foreground">{label}</span>
      <div className="h-4 flex-1 overflow-hidden rounded bg-muted">
        <div className="h-full rounded bg-primary" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-16 shrink-0 text-xs text-muted-foreground">{count} · {pct}%</span>
    </div>
  );
}

export default async function SurveyResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireAuth();
  if (!can(session.user.role, "survey:manage")) notFound();
  const t = await getTranslations("surveys");

  const survey = await db.survey.findUnique({
    where: { id },
    include: { questions: { orderBy: { order: "asc" } }, _count: { select: { participations: true } } },
  });
  if (!survey) notFound();

  const answers = await db.surveyAnswer.findMany({
    where: { question: { surveyId: id } },
    select: { questionId: true, value: true, text: true },
  });
  const byQuestion = new Map<string, { values: number[]; texts: string[] }>();
  for (const q of survey.questions) byQuestion.set(q.id, { values: [], texts: [] });
  for (const a of answers) {
    const bucket = byQuestion.get(a.questionId);
    if (!bucket) continue;
    if (a.value !== null) bucket.values.push(a.value);
    if (a.text) bucket.texts.push(a.text);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{survey.title}</h1>
          <Badge variant="secondary">{t(SURVEY_STATUS_KEY[survey.status])}</Badge>
        </div>
        <Link href={`/surveys/${id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
          {t("back")}
        </Link>
      </div>
      <p className="text-sm text-muted-foreground">{t("responseCount", { count: survey._count.participations })}</p>

      <div className="flex flex-col gap-4">
        {survey.questions.map((q, i) => {
          const b = byQuestion.get(q.id)!;
          const n = b.values.length;
          return (
            <Card key={q.id}>
              <CardContent className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-muted-foreground">{i + 1}.</span>
                  <span className="font-medium">{q.prompt}</span>
                  <Badge variant="secondary">{t(`qtype.${q.type}`)}</Badge>
                </div>

                {q.type === "SCALE" && (
                  <div className="flex flex-col gap-1.5">
                    <p className="text-sm">
                      {t("average")}: <span className="font-semibold">{n ? (b.values.reduce((s, v) => s + v, 0) / n).toFixed(2) : "—"}</span> / 5 ({t("nResponses", { count: n })})
                    </p>
                    {[5, 4, 3, 2, 1].map((lvl) => (
                      <Bar key={lvl} label={String(lvl)} count={b.values.filter((v) => v === lvl).length} total={n} />
                    ))}
                  </div>
                )}

                {q.type === "NPS" && (() => {
                  const promoters = b.values.filter((v) => v >= 9).length;
                  const detractors = b.values.filter((v) => v <= 6).length;
                  const passives = n - promoters - detractors;
                  const score = n ? Math.round(((promoters - detractors) / n) * 100) : 0;
                  return (
                    <div className="flex flex-col gap-1.5">
                      <p className="text-sm">
                        {t("npsScore")}: <span className="font-semibold">{n ? score : "—"}</span> ({t("nResponses", { count: n })})
                      </p>
                      <Bar label={t("promoters")} count={promoters} total={n} />
                      <Bar label={t("passives")} count={passives} total={n} />
                      <Bar label={t("detractors")} count={detractors} total={n} />
                    </div>
                  );
                })()}

                {q.type === "TEXT" && (
                  <div className="flex flex-col gap-2">
                    {b.texts.length === 0 ? (
                      <p className="text-sm text-muted-foreground">{t("noTextAnswers")}</p>
                    ) : (
                      b.texts.map((txt, idx) => (
                        <p key={idx} className="rounded-lg border bg-muted/30 p-2 text-sm whitespace-pre-wrap">
                          {txt}
                        </p>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
