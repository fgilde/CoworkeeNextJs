"use client";

import { useActionState, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ratingLabel } from "@/lib/performance";
import {
  createReview,
  updateReview,
  deleteReview,
  acknowledgeReview,
  type PerformanceActionState,
} from "@/app/actions/performance-actions";

const initialState: PerformanceActionState = {};

export type EmployeeOption = { id: string; name: string };

export const REVIEW_STATUS_KEY: Record<string, string> = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  ACKNOWLEDGED: "acknowledged",
};

const textareaClassName =
  "w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30";

/** "New review" form shown to managers/HR/ADMIN, scoped to their in-scope employees. */
export function NewReviewForm({ employees }: { employees: EmployeeOption[] }) {
  const t = useTranslations("performance");
  const [state, formAction, pending] = useActionState<PerformanceActionState, FormData>(createReview, initialState);

  if (employees.length === 0) return null;

  return (
    <Card>
      <CardContent>
        <form action={formAction} className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>{t("employee")}</Label>
            <Select name="employeeId" defaultValue={employees[0]?.id}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t("selectEmployee")} />
              </SelectTrigger>
              <SelectContent>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-review-period">{t("period")}</Label>
            <Input id="new-review-period" name="period" placeholder="2026-Q3" required className="w-40" />
          </div>
          <Button type="submit" disabled={pending}>
            {t("newReview")}
          </Button>
          {state.error && (
            <p className="w-full text-sm text-destructive" role="alert">
              {t(state.error)}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

/** Delete control for a review, shown to the reviewer or HR/ADMIN. */
export function DeleteReviewButton({ id }: { id: string }) {
  const t = useTranslations("performance");
  const [isDeleting, startDeleteTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={isDeleting}
        onClick={() => {
          if (!window.confirm(t("confirmDeleteReview"))) return;
          setError(null);
          startDeleteTransition(async () => {
            const result = await deleteReview(id);
            if (result.error) setError(t(result.error));
          });
        }}
      >
        {t("delete")}
      </Button>
      {error && (
        <span className="text-sm text-destructive" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

export type ReviewEditValues = {
  id: string;
  rating: number | null;
  strengths: string | null;
  improvements: string | null;
  comments: string | null;
  status: "DRAFT" | "SUBMITTED";
};

const RATING_KEYS = [1, 2, 3, 4, 5] as const;

/** Reviewer/HR-ADMIN editing form for a review, used on the review detail page. */
export function ReviewEditForm({ review }: { review: ReviewEditValues }) {
  const t = useTranslations("performance");
  const boundUpdate = (prevState: PerformanceActionState, formData: FormData) =>
    updateReview(review.id, prevState, formData);
  const [state, formAction, pending] = useActionState<PerformanceActionState, FormData>(boundUpdate, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label>{t("rating")}</Label>
        <Select name="rating" defaultValue={review.rating ? String(review.rating) : ""}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder={t("ratingLabels.unrated")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{t("ratingLabels.unrated")}</SelectItem>
            {RATING_KEYS.map((rating) => (
              <SelectItem key={rating} value={String(rating)}>
                {rating} · {t(`ratingLabels.${ratingLabel(rating)}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="review-strengths">{t("strengths")}</Label>
        <textarea
          id="review-strengths"
          name="strengths"
          rows={3}
          defaultValue={review.strengths ?? ""}
          className={textareaClassName}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="review-improvements">{t("improvements")}</Label>
        <textarea
          id="review-improvements"
          name="improvements"
          rows={3}
          defaultValue={review.improvements ?? ""}
          className={textareaClassName}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="review-comments">{t("comments")}</Label>
        <textarea
          id="review-comments"
          name="comments"
          rows={3}
          defaultValue={review.comments ?? ""}
          className={textareaClassName}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>{t("status")}</Label>
        <Select name="status" defaultValue={review.status}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="DRAFT">{t("draft")}</SelectItem>
            <SelectItem value="SUBMITTED">{t("submitted")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {state.error && (
        <p className="text-sm text-destructive" role="alert">
          {t(state.error)}
        </p>
      )}
      <div>
        <Button type="submit" disabled={pending}>
          {t("save")}
        </Button>
      </div>
    </form>
  );
}

/** Acknowledge button for the owning employee, shown once a review is SUBMITTED. */
export function AcknowledgeReviewButton({ id }: { id: string }) {
  const t = useTranslations("performance");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        disabled={isPending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await acknowledgeReview(id);
            if (result.error) setError(t(result.error));
          });
        }}
      >
        {t("acknowledge")}
      </Button>
      {error && (
        <span className="text-sm text-destructive" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
