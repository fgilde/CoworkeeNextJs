"use client";

import { useActionState, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createBenefit,
  updateBenefit,
  deleteBenefit,
  enroll,
  unenroll,
  type BenefitActionState,
} from "@/app/actions/benefit-actions";

const initialState: BenefitActionState = {};

const textareaClassName =
  "w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30";

export type BenefitFormValues = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  active: boolean;
};

/** Enroll / Leave toggle for the current employee on an active benefit. */
export function EnrollToggle({ benefitId, enrolled }: { benefitId: string; enrolled: boolean }) {
  const t = useTranslations("benefits");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant={enrolled ? "outline" : "default"}
        disabled={isPending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = enrolled ? await unenroll(benefitId) : await enroll(benefitId);
            if (result.error) setError(t(result.error));
          });
        }}
      >
        {enrolled ? t("leave") : t("enroll")}
      </Button>
      {error && (
        <span className="text-sm text-destructive" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

/** "New benefit" form shown to HR/ADMIN. */
export function NewBenefitForm() {
  const t = useTranslations("benefits");
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<BenefitActionState, FormData>(createBenefit, initialState);

  if (!open) {
    return <Button onClick={() => setOpen(true)}>{t("newBenefit")}</Button>;
  }

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="new-benefit-name">{t("name")}</Label>
        <Input id="new-benefit-name" name="name" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="new-benefit-category">{t("category")}</Label>
        <Input id="new-benefit-category" name="category" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="new-benefit-description">{t("description")}</Label>
        <textarea id="new-benefit-description" name="description" rows={3} className={textareaClassName} />
      </div>
      {state.error && (
        <p className="text-sm text-destructive" role="alert">
          {t(state.error)}
        </p>
      )}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {t("create")}
        </Button>
        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
          {t("cancel")}
        </Button>
      </div>
    </form>
  );
}

/** Per-benefit edit + delete controls, shown to HR/ADMIN. */
export function BenefitControls({ benefit }: { benefit: BenefitFormValues }) {
  const t = useTranslations("benefits");
  const [editing, setEditing] = useState(false);
  const boundUpdate = (prevState: BenefitActionState, formData: FormData) =>
    updateBenefit(benefit.id, prevState, formData);
  const [state, formAction, pending] = useActionState<BenefitActionState, FormData>(boundUpdate, initialState);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  if (editing) {
    return (
      <form action={formAction} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${benefit.id}-name`}>{t("name")}</Label>
          <Input id={`${benefit.id}-name`} name="name" defaultValue={benefit.name} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${benefit.id}-category`}>{t("category")}</Label>
          <Input id={`${benefit.id}-category`} name="category" defaultValue={benefit.category ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${benefit.id}-description`}>{t("description")}</Label>
          <textarea
            id={`${benefit.id}-description`}
            name="description"
            rows={3}
            defaultValue={benefit.description ?? ""}
            className={textareaClassName}
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            id={`${benefit.id}-active`}
            name="active"
            type="checkbox"
            defaultChecked={benefit.active}
            className="size-4 rounded border-input"
          />
          <Label htmlFor={`${benefit.id}-active`} className="font-normal">
            {t("active")}
          </Label>
        </div>
        {state.error && (
          <p className="text-sm text-destructive" role="alert">
            {t(state.error)}
          </p>
        )}
        <div className="flex items-center gap-3">
          <Button type="submit" size="sm" disabled={pending}>
            {t("save")}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setEditing(false)}>
            {t("cancel")}
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
        {t("edit")}
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={isDeleting}
        onClick={() => {
          if (!window.confirm(t("confirmDelete"))) return;
          setDeleteError(null);
          startDeleteTransition(async () => {
            const result = await deleteBenefit(benefit.id);
            if (result.error) setDeleteError(t(result.error));
          });
        }}
      >
        {t("delete")}
      </Button>
      {deleteError && (
        <span className="text-sm text-destructive" role="alert">
          {deleteError}
        </span>
      )}
    </div>
  );
}
