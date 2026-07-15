import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { requireAuth } from "@/lib/rbac";
import { db } from "@/lib/db";
import { ratingLabel } from "@/lib/performance";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ReviewEditForm,
  AcknowledgeReviewButton,
  REVIEW_STATUS_KEY,
} from "@/components/performance/review-form";

const REVIEW_STATUS_STYLES: Record<string, string | undefined> = {
  ACKNOWLEDGED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
};

export default async function ReviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireAuth();
  const t = await getTranslations("performance");
  const locale = await getLocale();

  const review = await db.review.findUnique({
    where: { id },
    include: {
      employee: { select: { id: true, firstName: true, lastName: true } },
      reviewer: { select: { id: true, firstName: true, lastName: true } },
    },
  });
  if (!review) notFound();

  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { employeeId: true } });
  const actorEmployeeId = user?.employeeId ?? null;
  const isHrOrAdmin = session.user.role === "HR" || session.user.role === "ADMIN";
  const isReviewer = actorEmployeeId !== null && actorEmployeeId === review.reviewerId;
  const isOwner = actorEmployeeId !== null && actorEmployeeId === review.employeeId;

  // DRAFT reviews stay invisible to the owning employee, even via a direct link —
  // only the reviewer or HR/ADMIN may see them.
  const isVisibleOwner = isOwner && review.status !== "DRAFT";
  if (!isReviewer && !isHrOrAdmin && !isVisibleOwner) notFound();

  const canEdit = (isReviewer || isHrOrAdmin) && review.status !== "ACKNOWLEDGED";
  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {review.employee.firstName} {review.employee.lastName} · {review.period}
        </h1>
        <Badge variant="secondary" className={REVIEW_STATUS_STYLES[review.status]}>
          {t(REVIEW_STATUS_KEY[review.status])}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground">
        {t("reviewer")}: {review.reviewer.firstName} {review.reviewer.lastName}
        {review.submittedAt && ` · ${dateFormatter.format(review.submittedAt)}`}
      </p>

      <Card>
        <CardContent>
          {canEdit ? (
            // canEdit implies status !== "ACKNOWLEDGED", so this narrows to "DRAFT" | "SUBMITTED".
            <ReviewEditForm
              review={{
                id: review.id,
                rating: review.rating,
                strengths: review.strengths,
                improvements: review.improvements,
                comments: review.comments,
                status: review.status as "DRAFT" | "SUBMITTED",
              }}
            />
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm">
                <span className="font-medium">{t("rating")}:</span>{" "}
                {t(`ratingLabels.${ratingLabel(review.rating)}`)}
              </p>
              <p className="text-sm">
                <span className="font-medium">{t("strengths")}:</span> {review.strengths ?? "—"}
              </p>
              <p className="text-sm">
                <span className="font-medium">{t("improvements")}:</span> {review.improvements ?? "—"}
              </p>
              <p className="text-sm">
                <span className="font-medium">{t("comments")}:</span> {review.comments ?? "—"}
              </p>
              {isOwner && review.status === "SUBMITTED" && <AcknowledgeReviewButton id={review.id} />}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
