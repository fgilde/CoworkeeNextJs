"use client";

import { useActionState, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createTemplate,
  updateTemplate,
  deleteTemplate,
  addTemplateItem,
  updateTemplateItem,
  deleteTemplateItem,
  type OnboardingActionState,
} from "@/app/actions/onboarding-actions";

const TYPES = ["ONBOARDING", "OFFBOARDING"] as const;

export type TemplateItemValues = { id: string; title: string };
export type TemplateValues = {
  id: string;
  name: string;
  type: (typeof TYPES)[number];
  items: TemplateItemValues[];
};

const initialState: OnboardingActionState = {};

function TypeSelect({ idPrefix, defaultValue }: { idPrefix: string; defaultValue: string }) {
  const t = useTranslations("onboarding");
  return (
    <Select name="type" defaultValue={defaultValue}>
      <SelectTrigger id={`${idPrefix}-type`} className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {TYPES.map((type) => (
          <SelectItem key={type} value={type}>
            {t(type.toLowerCase())}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Inline "+ New template" button that reveals a create form. */
export function NewTemplateButton() {
  const t = useTranslations("onboarding");
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<OnboardingActionState, FormData>(createTemplate, initialState);

  if (!open) {
    return <Button onClick={() => setOpen(true)}>{t("newTemplate")}</Button>;
  }

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="new-template-name">{t("template")}</Label>
        <Input id="new-template-name" name="name" required className="h-9 w-56" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="new-template-type">{t("type")}</Label>
        <TypeSelect idPrefix="new-template" defaultValue="ONBOARDING" />
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

function AddItemForm({ templateId }: { templateId: string }) {
  const t = useTranslations("onboarding");
  const boundAdd = (prevState: OnboardingActionState, formData: FormData) => addTemplateItem(templateId, prevState, formData);
  const [state, formAction, pending] = useActionState<OnboardingActionState, FormData>(boundAdd, initialState);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <Input name="title" placeholder={t("itemTitle")} required className="h-8 w-56" />
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {t("addItem")}
      </Button>
      {state.error && (
        <span className="text-xs text-destructive" role="alert">
          {t(state.error)}
        </span>
      )}
    </form>
  );
}

function TemplateItemRow({ item }: { item: TemplateItemValues }) {
  const t = useTranslations("onboarding");
  const tCommon = useTranslations("common");
  const [editing, setEditing] = useState(false);
  const boundUpdate = (prevState: OnboardingActionState, formData: FormData) => updateTemplateItem(item.id, prevState, formData);
  const [state, formAction, pending] = useActionState<OnboardingActionState, FormData>(boundUpdate, initialState);
  const [isDeleting, startDeleteTransition] = useTransition();

  if (editing) {
    return (
      <form action={formAction} className="flex items-center gap-2">
        <Input name="title" defaultValue={item.title} required className="h-8 w-56" />
        <Button type="submit" size="sm" disabled={pending}>
          {t("save")}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setEditing(false)}>
          {t("cancel")}
        </Button>
        {state.error && (
          <span className="text-xs text-destructive" role="alert">
            {t(state.error)}
          </span>
        )}
      </form>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="flex-1">{item.title}</span>
      <Button size="sm" variant="ghost" aria-label={tCommon("edit")} onClick={() => setEditing(true)}>
        <Pencil className="size-3.5" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        disabled={isDeleting}
        onClick={() =>
          startDeleteTransition(async () => {
            await deleteTemplateItem(item.id);
          })
        }
      >
        {t("delete")}
      </Button>
    </div>
  );
}

export function TemplateCard({ template }: { template: TemplateValues }) {
  const t = useTranslations("onboarding");
  const tCommon = useTranslations("common");
  const [editing, setEditing] = useState(false);
  const boundUpdate = (prevState: OnboardingActionState, formData: FormData) => updateTemplate(template.id, prevState, formData);
  const [state, formAction, pending] = useActionState<OnboardingActionState, FormData>(boundUpdate, initialState);
  const [isDeleting, startDeleteTransition] = useTransition();

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        {editing ? (
          <form action={formAction} className="flex flex-wrap items-end gap-3">
            <Input name="name" defaultValue={template.name} required className="h-9 w-56" />
            <TypeSelect idPrefix={template.id} defaultValue={template.type} />
            <Button type="submit" size="sm" disabled={pending}>
              {t("save")}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setEditing(false)}>
              {t("cancel")}
            </Button>
            {state.error && (
              <p className="w-full text-sm text-destructive" role="alert">
                {t(state.error)}
              </p>
            )}
          </form>
        ) : (
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{template.name}</h3>
              <Badge variant="outline">{t(template.type.toLowerCase())}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                {tCommon("edit")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={isDeleting}
                onClick={() => {
                  if (!window.confirm(t("confirmDeleteTemplate"))) return;
                  startDeleteTransition(async () => {
                    await deleteTemplate(template.id);
                  });
                }}
              >
                {t("delete")}
              </Button>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1.5 border-t border-border pt-3">
          {template.items.map((item) => (
            <TemplateItemRow key={item.id} item={item} />
          ))}
          <div className="pt-1">
            <AddItemForm templateId={template.id} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
