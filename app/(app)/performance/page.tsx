import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { requireAuth, can } from "@/lib/rbac";
import { db } from "@/lib/db";
import { ratingLabel } from "@/lib/performance";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NewGoalForm, GoalControls, OwnGoalProgress, ProgressBar } from "@/components/performance/goal-form";
import {
  NewReviewForm,
  DeleteReviewButton,
  AcknowledgeReviewButton,
  REVIEW_STATUS_KEY,
} from "@/components/performance/review-form";

const GOAL_STATUS_STYLES: Record<string, string | undefined> = {
  DONE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  CANCELLED: "bg-destructive/10 text-destructive",
};

const REVIEW_STATUS_STYLES: Record<string, string | undefined> = {
  ACKNOWLEDGED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
};

function toDateInputValue(date: Date | null): string | null {
  return date ? date.toISOString().slice(0, 10) : null;
}

export default async function PerformancePage() {
  const session = await requireAuth();
  const t = await getTranslations("performance");
  const locale = await getLocale();
  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { employeeId: true },
  });

  const header = <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>;
  const canManage = can(session.user.role, "goal:manage");

  if (!canManage) {
    if (!user?.employeeId) {
      return (
        <div className="flex flex-col gap-6">
          {header}
          <Card>
            <CardContent className="text-sm text-muted-foreground">{t("noEmployee")}</CardContent>
          </Card>
        </div>
      );
    }

    const employeeId = user.employeeId;
    const [goals, reviews] = await Promise.all([
      db.goal.findMany({ where: { employeeId }, orderBy: { createdAt: "desc" } }),
      // DRAFT reviews are only visible to the reviewer / HR / ADMIN — never to the employee.
      db.review.findMany({
        where: { employeeId, status: { not: "DRAFT" } },
        include: { reviewer: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return (
      <div className="flex flex-col gap-8">
        {header}

        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t("myGoals")}</h2>
          {goals.length === 0 ? (
            <Card>
              <CardContent className="text-sm text-muted-foreground">{t("noGoals")}</CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {goals.map((goal) => (
                <Card key={goal.id}>
                  <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{goal.title}</span>
                        <Badge variant="secondary" className={GOAL_STATUS_STYLES[goal.status]}>
                          {t(`goalStatus.${goal.status}`)}
                        </Badge>
                      </div>
                      {goal.description && <p className="text-sm text-muted-foreground">{goal.description}</p>}
                      {goal.dueDate && (
                        <p className="text-xs text-muted-foreground">
                          {t("dueDate")}: {dateFormatter.format(goal.dueDate)}
                        </p>
                      )}
                    </div>
                    <OwnGoalProgress goal={{ id: goal.id, progress: goal.progress }} />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t("myReviews")}</h2>
          {reviews.length === 0 ? (
            <Card>
              <CardContent className="text-sm text-muted-foreground">{t("noReviews")}</CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {reviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{review.period}</span>
                        <Badge variant="secondary" className={REVIEW_STATUS_STYLES[review.status]}>
                          {t(REVIEW_STATUS_KEY[review.status])}
                        </Badge>
                      </div>
                      {review.status === "SUBMITTED" && <AcknowledgeReviewButton id={review.id} />}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t("reviewer")}: {review.reviewer.firstName} {review.reviewer.lastName}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">{t("rating")}:</span>{" "}
                      {t(`ratingLabels.${ratingLabel(review.rating)}`)}
                    </p>
                    {review.strengths && (
                      <p className="text-sm">
                        <span className="font-medium">{t("strengths")}:</span> {review.strengths}
                      </p>
                    )}
                    {review.improvements && (
                      <p className="text-sm">
                        <span className="font-medium">{t("improvements")}:</span> {review.improvements}
                      </p>
                    )}
                    {review.comments && (
                      <p className="text-sm">
                        <span className="font-medium">{t("comments")}:</span> {review.comments}
                      </p>
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

  // MANAGER/HR/ADMIN view — team scoped (MANAGER: own reports, HR/ADMIN: everyone).
  const managerEmployeeId = session.user.role === "MANAGER" ? (user?.employeeId ?? "__none__") : undefined;

  const inScopeEmployees = await db.employee.findMany({
    where: managerEmployeeId ? { managerId: managerEmployeeId } : undefined,
    select: { id: true, firstName: true, lastName: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
  const scopeIds = inScopeEmployees.map((e) => e.id);
  const employeeOptions = inScopeEmployees.map((e) => ({ id: e.id, name: `${e.firstName} ${e.lastName}` }));

  const [goals, reviews] = await Promise.all([
    db.goal.findMany({
      where: { employeeId: { in: scopeIds } },
      include: { employee: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.review.findMany({
      where: { employeeId: { in: scopeIds } },
      include: { employee: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      {header}

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold tracking-tight">{t("teamGoals")}</h2>
        <NewGoalForm employees={employeeOptions} />
        {goals.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noGoals")}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {goals.map((goal) => (
              <Card key={goal.id}>
                <CardContent className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">
                        {goal.employee.firstName} {goal.employee.lastName}
                      </span>
                      <span className="text-sm text-muted-foreground">· {goal.title}</span>
                      <Badge variant="secondary" className={GOAL_STATUS_STYLES[goal.status]}>
                        {t(`goalStatus.${goal.status}`)}
                      </Badge>
                    </div>
                    <GoalControls
                      goal={{
                        id: goal.id,
                        title: goal.title,
                        description: goal.description,
                        status: goal.status,
                        progress: goal.progress,
                        dueDate: toDateInputValue(goal.dueDate),
                      }}
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <ProgressBar percent={goal.progress} />
                    {goal.dueDate && (
                      <span className="text-xs text-muted-foreground">
                        {t("dueDate")}: {dateFormatter.format(goal.dueDate)}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold tracking-tight">{t("teamReviews")}</h2>
        <NewReviewForm employees={employeeOptions} />
        {reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noReviews")}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/performance/reviews/${review.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {review.employee.firstName} {review.employee.lastName} · {review.period}
                    </Link>
                    <Badge variant="secondary" className={REVIEW_STATUS_STYLES[review.status]}>
                      {t(REVIEW_STATUS_KEY[review.status])}
                    </Badge>
                    {review.rating !== null && (
                      <span className="text-sm text-muted-foreground">
                        {t(`ratingLabels.${ratingLabel(review.rating)}`)}
                      </span>
                    )}
                  </div>
                  <DeleteReviewButton id={review.id} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
