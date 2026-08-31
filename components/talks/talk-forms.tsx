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
  createTalk,
  releaseTalk,
  completeTalk,
  deleteTalk,
  saveTalkAnswers,
  type TalkActionState,
} from "@/app/actions/talk-actions";

const initialState: TalkActionState = {};

const textareaClassName =
  "w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30";

export const TALK_STATUS_KEY: Record<string, string> = {
  DRAFT: "statusDraft",
  SHARED: "statusShared",
  COMPLETED: "statusCompleted",
};

export type EmployeeOption = { id: string; name: string };
export type TemplateOption = { id: string; title: string };

/** Schedule a new talk from a template for an in-scope employee. */
export function NewTalkForm({
  employees,
  templates,
}: {
  employees: EmployeeOption[];
  templates: TemplateOption[];
}) {
  const t = useTranslations("talks");
  const [state, formAction, pending] = useActionState<TalkActionState, FormData>(createTalk, initialState);

  if (employees.length === 0) return <p className="text-sm text-muted-foreground">{t("noTeam")}</p>;
  if (templates.length === 0) return <p className="text-sm text-muted-foreground">{t("noTemplatesYet")}</p>;

  return (
    <Card>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>{t("employee")}</Label>
              <Select
                name="employeeId"
                defaultValue={employees[0]?.id}
                items={Object.fromEntries(employees.map((e) => [e.id, e.name]))}
              >
                <SelectTrigger className="w-52">
                  <SelectValue placeholder={t("selectEmployee")} />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t("template")}</Label>
              <Select
                name="templateId"
                defaultValue={templates[0]?.id}
                items={Object.fromEntries(templates.map((tpl) => [tpl.id, tpl.title]))}
              >
                <SelectTrigger className="w-52">
                  <SelectValue placeholder={t("selectTemplate")} />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((tpl) => (
                    <SelectItem key={tpl.id} value={tpl.id}>
                      {tpl.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="talk-date">{t("scheduledAt")}</Label>
              <Input id="talk-date" type="date" name="scheduledAt" className="w-40" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="talk-title">{t("talkTitle")}</Label>
            <Input id="talk-title" name="title" required placeholder={t("talkTitlePlaceholder")} className="max-w-md" />
          </div>
          <div>
            <Button type="submit" disabled={pending}>
              {t("newTalk")}
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

export function ReleaseTalkButton({ id }: { id: string }) {
  const t = useTranslations("talks");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        disabled={pending}
        onClick={() => {
          if (!window.confirm(t("confirmRelease"))) return;
          setError(null);
          start(async () => {
            const r = await releaseTalk(id);
            if (r.error) setError(t(r.error));
          });
        }}
      >
        {t("release")}
      </Button>
      {error && <span className="text-sm text-destructive">{error}</span>}
    </div>
  );
}

export function DeleteTalkButton({ id }: { id: string }) {
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
          if (!window.confirm(t("confirmDeleteTalk"))) return;
          setError(null);
          start(async () => {
            const r = await deleteTalk(id);
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

/** Manager/HR closes the talk with a shared summary/outcome. */
export function CompleteTalkForm({ id }: { id: string }) {
  const t = useTranslations("talks");
  const bound = (prev: TalkActionState, fd: FormData) => completeTalk(id, prev, fd);
  const [state, formAction, pending] = useActionState<TalkActionState, FormData>(bound, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="talk-summary">{t("summary")}</Label>
        <textarea id="talk-summary" name="summary" rows={3} className={textareaClassName} placeholder={t("summaryHint")} />
      </div>
      <div>
        <Button type="submit" disabled={pending}>
          {t("complete")}
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

export type AgendaItem = {
  id: string;
  type: "SECTION" | "TEXT" | "RATING" | "YESNO";
  prompt: string;
  helpText: string | null;
  required: boolean;
};
export type PartyAnswer = { text: string | null; rating: number | null };
export type AgendaAnswers = Record<string, { MANAGER?: PartyAnswer; EMPLOYEE?: PartyAnswer }>;

const RATINGS = [1, 2, 3, 4, 5] as const;

function ReadonlyAnswer({ item, answer }: { item: AgendaItem; answer?: PartyAnswer }) {
  const t = useTranslations("talks");
  if (!answer || (answer.text === null && answer.rating === null)) {
    return <span className="text-sm text-muted-foreground italic">{t("noAnswerYet")}</span>;
  }
  if (item.type === "RATING") return <span className="text-sm font-medium">{answer.rating ?? "—"} / 5</span>;
  if (item.type === "YESNO")
    return <span className="text-sm font-medium">{answer.text ? t(`yesno.${answer.text}`) : "—"}</span>;
  return <span className="text-sm whitespace-pre-wrap">{answer.text ?? "—"}</span>;
}

function EditableInput({ item, mine }: { item: AgendaItem; mine?: PartyAnswer }) {
  const t = useTranslations("talks");
  if (item.type === "RATING") {
    return (
      <div className="flex flex-wrap gap-3">
        {RATINGS.map((r) => (
          <label key={r} className="flex items-center gap-1 text-sm">
            <input type="radio" name={`rating__${item.id}`} value={r} defaultChecked={mine?.rating === r} />
            {r}
          </label>
        ))}
        <label className="flex items-center gap-1 text-sm text-muted-foreground">
          <input type="radio" name={`rating__${item.id}`} value="" defaultChecked={!mine?.rating} />
          {t("noRating")}
        </label>
      </div>
    );
  }
  if (item.type === "YESNO") {
    return (
      <div className="flex gap-4">
        {["YES", "NO"].map((v) => (
          <label key={v} className="flex items-center gap-1 text-sm">
            <input type="radio" name={`text__${item.id}`} value={v} defaultChecked={mine?.text === v} />
            {t(`yesno.${v}`)}
          </label>
        ))}
        <label className="flex items-center gap-1 text-sm text-muted-foreground">
          <input type="radio" name={`text__${item.id}`} value="" defaultChecked={mine?.text !== "YES" && mine?.text !== "NO"} />
          {t("noAnswer")}
        </label>
      </div>
    );
  }
  return (
    <textarea
      name={`text__${item.id}`}
      rows={3}
      defaultValue={mine?.text ?? ""}
      className={textareaClassName}
    />
  );
}

/**
 * The two-column agenda: manager and employee each keep their own answer. When
 * `mySide` is set and `editable`, the acting side's column becomes inputs inside
 * a save form; the other side is always read-only.
 */
export function TalkAgenda({
  talkId,
  items,
  answers,
  mySide,
  editable,
  managerLabel,
  employeeLabel,
}: {
  talkId: string;
  items: AgendaItem[];
  answers: AgendaAnswers;
  mySide: "MANAGER" | "EMPLOYEE" | null;
  editable: boolean;
  managerLabel: string;
  employeeLabel: string;
}) {
  const t = useTranslations("talks");
  const bound = (prev: TalkActionState, fd: FormData) => saveTalkAnswers(talkId, prev, fd);
  const [state, formAction, pending] = useActionState<TalkActionState, FormData>(bound, initialState);
  const showForm = editable && mySide !== null;

  const body = (
    <div className="flex flex-col gap-5">
      {items.map((item) => {
        if (item.type === "SECTION") {
          return (
            <h3 key={item.id} className="border-b pb-1 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
              {item.prompt}
            </h3>
          );
        }
        const mgr = answers[item.id]?.MANAGER;
        const emp = answers[item.id]?.EMPLOYEE;
        return (
          <div key={item.id} className="flex flex-col gap-2">
            <div className="flex flex-col gap-0.5">
              <span className="font-medium">
                {item.prompt}
                {item.required && <span className="text-destructive"> *</span>}
              </span>
              {item.helpText && <span className="text-xs text-muted-foreground">{item.helpText}</span>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1 rounded-lg border bg-muted/30 p-3">
                <span className="text-xs font-semibold text-muted-foreground">{managerLabel}</span>
                {showForm && mySide === "MANAGER" ? (
                  <EditableInput item={item} mine={mgr} />
                ) : (
                  <ReadonlyAnswer item={item} answer={mgr} />
                )}
              </div>
              <div className="flex flex-col gap-1 rounded-lg border bg-muted/30 p-3">
                <span className="text-xs font-semibold text-muted-foreground">{employeeLabel}</span>
                {showForm && mySide === "EMPLOYEE" ? (
                  <EditableInput item={item} mine={emp} />
                ) : (
                  <ReadonlyAnswer item={item} answer={emp} />
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  if (!showForm) return body;

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {body}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {t("saveMyAnswers")}
        </Button>
        {state.error && (
          <span className="text-sm text-destructive" role="alert">
            {t(state.error)}
          </span>
        )}
      </div>
    </form>
  );
}
