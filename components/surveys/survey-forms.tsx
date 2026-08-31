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
  createSurvey,
  updateSurvey,
  addSurveyQuestion,
  deleteSurveyQuestion,
  openSurvey,
  closeSurvey,
  deleteSurvey,
  submitSurveyResponse,
  type SurveyActionState,
} from "@/app/actions/survey-actions";

const initialState: SurveyActionState = {};
const textareaClassName =
  "w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30";

export const SURVEY_STATUS_KEY: Record<string, string> = {
  DRAFT: "statusDraft",
  OPEN: "statusOpen",
  CLOSED: "statusClosed",
};
export const QUESTION_TYPES = ["SCALE", "NPS", "TEXT"] as const;

function AnonToggle({ defaultChecked }: { defaultChecked?: boolean }) {
  const t = useTranslations("surveys");
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" name="anonymous" defaultChecked={defaultChecked ?? true} className="size-4" />
      {t("anonymousHint")}
    </label>
  );
}

export function NewSurveyForm() {
  const t = useTranslations("surveys");
  const [state, formAction, pending] = useActionState<SurveyActionState, FormData>(createSurvey, initialState);
  return (
    <Card>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="s-title">{t("surveyTitle")}</Label>
            <Input id="s-title" name="title" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="s-desc">{t("description")}</Label>
            <textarea id="s-desc" name="description" rows={2} className={textareaClassName} />
          </div>
          <AnonToggle />
          <div>
            <Button type="submit" disabled={pending}>
              {t("newSurvey")}
            </Button>
          </div>
          {state.error && <p className="text-sm text-destructive" role="alert">{t(state.error)}</p>}
        </form>
      </CardContent>
    </Card>
  );
}

export function SurveyMetaForm({
  survey,
}: {
  survey: { id: string; title: string; description: string | null; anonymous: boolean };
}) {
  const t = useTranslations("surveys");
  const bound = (p: SurveyActionState, fd: FormData) => updateSurvey(survey.id, p, fd);
  const [state, formAction, pending] = useActionState<SurveyActionState, FormData>(bound, initialState);
  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="s-edit-title">{t("surveyTitle")}</Label>
        <Input id="s-edit-title" name="title" required defaultValue={survey.title} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="s-edit-desc">{t("description")}</Label>
        <textarea id="s-edit-desc" name="description" rows={2} defaultValue={survey.description ?? ""} className={textareaClassName} />
      </div>
      <AnonToggle defaultChecked={survey.anonymous} />
      <div>
        <Button type="submit" disabled={pending}>{t("save")}</Button>
      </div>
      {state.error && <p className="text-sm text-destructive" role="alert">{t(state.error)}</p>}
    </form>
  );
}

export function AddQuestionForm({ surveyId }: { surveyId: string }) {
  const t = useTranslations("surveys");
  const bound = (p: SurveyActionState, fd: FormData) => addSurveyQuestion(surveyId, p, fd);
  const [state, formAction, pending] = useActionState<SurveyActionState, FormData>(bound, initialState);
  const [type, setType] = useState<string>("SCALE");
  return (
    <Card>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>{t("questionType")}</Label>
              <Select
                name="type"
                value={type}
                onValueChange={(v) => setType(typeof v === "string" ? v : "SCALE")}
                items={Object.fromEntries(QUESTION_TYPES.map((q) => [q, t(`qtype.${q}`)]))}
              >
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QUESTION_TYPES.map((q) => (
                    <SelectItem key={q} value={q}>{t(`qtype.${q}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-2 pb-2 text-sm">
              <input type="checkbox" name="required" defaultChecked className="size-4" />
              {t("required")}
            </label>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="q-prompt">{t("question")}</Label>
            <Input id="q-prompt" name="prompt" required />
          </div>
          <div>
            <Button type="submit" disabled={pending}>{t("addQuestion")}</Button>
          </div>
          {state.error && <p className="text-sm text-destructive" role="alert">{t(state.error)}</p>}
        </form>
      </CardContent>
    </Card>
  );
}

function ActionButton({
  run,
  label,
  confirm,
  variant = "default",
}: {
  run: () => Promise<SurveyActionState>;
  label: string;
  confirm?: string;
  variant?: "default" | "outline";
}) {
  const t = useTranslations("surveys");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant={variant}
        disabled={pending}
        onClick={() => {
          if (confirm && !window.confirm(confirm)) return;
          setError(null);
          start(async () => {
            const r = await run();
            if (r.error) setError(t(r.error));
          });
        }}
      >
        {label}
      </Button>
      {error && <span className="text-sm text-destructive">{error}</span>}
    </div>
  );
}

export function DeleteQuestionButton({ id }: { id: string }) {
  const t = useTranslations("surveys");
  return <ActionButton run={() => deleteSurveyQuestion(id)} label={t("remove")} variant="outline" />;
}
export function OpenSurveyButton({ id }: { id: string }) {
  const t = useTranslations("surveys");
  return <ActionButton run={() => openSurvey(id)} label={t("open")} confirm={t("confirmOpen")} />;
}
export function CloseSurveyButton({ id }: { id: string }) {
  const t = useTranslations("surveys");
  return <ActionButton run={() => closeSurvey(id)} label={t("close")} confirm={t("confirmClose")} variant="outline" />;
}
export function DeleteSurveyButton({ id }: { id: string }) {
  const t = useTranslations("surveys");
  return <ActionButton run={() => deleteSurvey(id)} label={t("delete")} confirm={t("confirmDelete")} variant="outline" />;
}

export type RespondQuestion = { id: string; type: "SCALE" | "NPS" | "TEXT"; prompt: string; required: boolean };

export function RespondForm({ surveyId, questions }: { surveyId: string; questions: RespondQuestion[] }) {
  const t = useTranslations("surveys");
  const bound = (p: SurveyActionState, fd: FormData) => submitSurveyResponse(surveyId, p, fd);
  const [state, formAction, pending] = useActionState<SurveyActionState, FormData>(bound, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {questions.map((q, i) => (
        <div key={q.id} className="flex flex-col gap-2">
          <span className="font-medium">
            {i + 1}. {q.prompt}
            {q.required && <span className="text-destructive"> *</span>}
          </span>
          {q.type === "TEXT" ? (
            <textarea name={`q__${q.id}`} rows={3} className={textareaClassName} />
          ) : (
            <div className="flex flex-wrap gap-2">
              {(q.type === "NPS" ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] : [1, 2, 3, 4, 5]).map((n) => (
                <label
                  key={n}
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border text-sm has-checked:border-primary has-checked:bg-primary has-checked:text-primary-foreground"
                >
                  <input type="radio" name={`q__${q.id}`} value={n} className="sr-only" />
                  {n}
                </label>
              ))}
            </div>
          )}
          {q.type === "SCALE" && <span className="text-xs text-muted-foreground">{t("scaleHint")}</span>}
          {q.type === "NPS" && <span className="text-xs text-muted-foreground">{t("npsHint")}</span>}
        </div>
      ))}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>{t("submitResponse")}</Button>
        {state.error && <span className="text-sm text-destructive" role="alert">{t(state.error)}</span>}
      </div>
    </form>
  );
}
