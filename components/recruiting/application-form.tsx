"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createApplication,
  updateApplication,
  type RecruitingActionState,
} from "@/app/actions/recruiting-actions";

const initialState: RecruitingActionState = {};

const RATINGS = [1, 2, 3, 4, 5] as const;

const textareaClassName =
  "w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

/** Inline "Add applicant" button that reveals a create form, scoped to one job posting. */
export function NewApplicationForm({ jobPostingId }: { jobPostingId: string }) {
  const t = useTranslations("recruiting");
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<RecruitingActionState, FormData>(createApplication, initialState);

  if (!open) {
    return <Button onClick={() => setOpen(true)}>{t("newApplication")}</Button>;
  }

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4">
      <input type="hidden" name="jobPostingId" value={jobPostingId} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="new-app-firstName">{t("firstName")}</Label>
        <Input id="new-app-firstName" name="firstName" required className="h-9 w-40" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="new-app-lastName">{t("lastName")}</Label>
        <Input id="new-app-lastName" name="lastName" required className="h-9 w-40" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="new-app-email">{t("email")}</Label>
        <Input id="new-app-email" name="email" type="email" required className="h-9 w-56" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="new-app-phone">{t("phone")}</Label>
        <Input id="new-app-phone" name="phone" className="h-9 w-40" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="new-app-notes">{t("notes")}</Label>
        <Input id="new-app-notes" name="notes" className="h-9 w-56" />
      </div>
      <Button type="submit" disabled={pending}>
        {t("save")}
      </Button>
      <Button type="button" variant="outline" onClick={() => setOpen(false)}>
        {t("cancel")}
      </Button>
      {state.error && (
        <p className="w-full text-sm text-destructive" role="alert">
          {t(state.error)}
        </p>
      )}
    </form>
  );
}

export type ApplicationEditValues = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  rating: number | null;
  notes: string | null;
  stage: string;
};

/** Edit form for an application's details (name/contact/rating/notes). Stage is moved via a separate control. */
export function ApplicationEditForm({
  application,
  onCancel,
}: {
  application: ApplicationEditValues;
  onCancel: () => void;
}) {
  const t = useTranslations("recruiting");
  const boundUpdate = (prevState: RecruitingActionState, formData: FormData) =>
    updateApplication(application.id, prevState, formData);
  const [state, formAction, pending] = useActionState<RecruitingActionState, FormData>(boundUpdate, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="stage" value={application.stage} />
      <Input name="firstName" defaultValue={application.firstName} required placeholder={t("firstName")} className="h-8" />
      <Input name="lastName" defaultValue={application.lastName} required placeholder={t("lastName")} className="h-8" />
      <Input name="email" type="email" defaultValue={application.email} required placeholder={t("email")} className="h-8" />
      <Input name="phone" defaultValue={application.phone ?? ""} placeholder={t("phone")} className="h-8" />
      <Select name="rating" defaultValue={application.rating ? String(application.rating) : ""}>
        <SelectTrigger className="h-8 w-full">
          <SelectValue placeholder={t("rating")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">—</SelectItem>
          {RATINGS.map((r) => (
            <SelectItem key={r} value={String(r)}>
              {"★".repeat(r)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <textarea
        name="notes"
        rows={2}
        defaultValue={application.notes ?? ""}
        placeholder={t("notes")}
        className={textareaClassName}
      />
      {state.error && (
        <p className="text-xs text-destructive" role="alert">
          {t(state.error)}
        </p>
      )}
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {t("save")}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel}>
          {t("cancel")}
        </Button>
      </div>
    </form>
  );
}
