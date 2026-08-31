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
import {
  createTemplate,
  updateTemplate,
  deleteTemplate,
  addTemplateItem,
  deleteTemplateItem,
  type TalkActionState,
} from "@/app/actions/talk-actions";

const initialState: TalkActionState = {};

const textareaClassName =
  "w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30";

export const ITEM_TYPES = ["SECTION", "TEXT", "RATING", "YESNO"] as const;

/** Create a new talk template. `canShare` gates the org-wide toggle (HR/ADMIN only). */
export function NewTemplateForm({ canShare }: { canShare: boolean }) {
  const t = useTranslations("talks");
  const [state, formAction, pending] = useActionState<TalkActionState, FormData>(createTemplate, initialState);

  return (
    <Card>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tpl-title">{t("templateTitle")}</Label>
            <Input id="tpl-title" name="title" required placeholder={t("templateTitlePlaceholder")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tpl-desc">{t("description")}</Label>
            <textarea id="tpl-desc" name="description" rows={2} className={textareaClassName} />
          </div>
          {canShare && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="shared" className="size-4" />
              {t("sharedTemplateHint")}
            </label>
          )}
          <div>
            <Button type="submit" disabled={pending}>
              {t("newTemplate")}
            </Button>
          </div>
          {state.error && (
            <p className="text-sm text-destructive" role="alert">
              {t(state.error)}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

export type TemplateEditValues = {
  id: string;
  title: string;
  description: string | null;
  shared: boolean;
};

/** Edit a template's meta (title/description/shared). */
export function TemplateEditForm({ template, canShare }: { template: TemplateEditValues; canShare: boolean }) {
  const t = useTranslations("talks");
  const bound = (prev: TalkActionState, fd: FormData) => updateTemplate(template.id, prev, fd);
  const [state, formAction, pending] = useActionState<TalkActionState, FormData>(bound, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tpl-edit-title">{t("templateTitle")}</Label>
        <Input id="tpl-edit-title" name="title" required defaultValue={template.title} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tpl-edit-desc">{t("description")}</Label>
        <textarea
          id="tpl-edit-desc"
          name="description"
          rows={2}
          defaultValue={template.description ?? ""}
          className={textareaClassName}
        />
      </div>
      {canShare && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="shared" defaultChecked={template.shared} className="size-4" />
          {t("sharedTemplateHint")}
        </label>
      )}
      <div>
        <Button type="submit" disabled={pending}>
          {t("save")}
        </Button>
      </div>
      {state.error && (
        <p className="text-sm text-destructive" role="alert">
          {t(state.error)}
        </p>
      )}
    </form>
  );
}

/** Add an agenda item (question) to a template. */
export function AddItemForm({ templateId }: { templateId: string }) {
  const t = useTranslations("talks");
  const bound = (prev: TalkActionState, fd: FormData) => addTemplateItem(templateId, prev, fd);
  const [state, formAction, pending] = useActionState<TalkActionState, FormData>(bound, initialState);
  const [type, setType] = useState<string>("TEXT");

  return (
    <Card>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>{t("itemTypeLabel")}</Label>
              <Select
                name="type"
                value={type}
                onValueChange={(v) => setType(typeof v === "string" ? v : "TEXT")}
                items={Object.fromEntries(ITEM_TYPES.map((it) => [it, t(`itemType.${it}`)]))}
              >
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ITEM_TYPES.map((it) => (
                    <SelectItem key={it} value={it}>
                      {t(`itemType.${it}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {type !== "SECTION" && (
              <label className="flex items-center gap-2 pb-2 text-sm">
                <input type="checkbox" name="required" className="size-4" />
                {t("required")}
              </label>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="item-prompt">{type === "SECTION" ? t("sectionTitle") : t("question")}</Label>
            <Input id="item-prompt" name="prompt" required />
          </div>
          {type !== "SECTION" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="item-help">{t("helpText")}</Label>
              <Input id="item-help" name="helpText" />
            </div>
          )}
          <div>
            <Button type="submit" disabled={pending}>
              {t("addItem")}
            </Button>
          </div>
          {state.error && (
            <p className="text-sm text-destructive" role="alert">
              {t(state.error)}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

export function DeleteItemButton({ id }: { id: string }) {
  const t = useTranslations("talks");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => {
          setError(null);
          start(async () => {
            const r = await deleteTemplateItem(id);
            if (r.error) setError(t(r.error));
          });
        }}
      >
        {t("remove")}
      </Button>
      {error && <span className="text-sm text-destructive">{error}</span>}
    </div>
  );
}

export function DeleteTemplateButton({ id }: { id: string }) {
  const t = useTranslations("talks");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => {
          if (!window.confirm(t("confirmDeleteTemplate"))) return;
          setError(null);
          start(async () => {
            const r = await deleteTemplate(id);
            if (r.error) setError(t(r.error));
          });
        }}
      >
        {t("delete")}
      </Button>
      {error && <span className="text-sm text-destructive">{error}</span>}
    </div>
  );
}
