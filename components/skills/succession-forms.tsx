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
  upsertSuccessionPlan,
  deleteSuccessionPlan,
  addSuccessionCandidate,
  removeSuccessionCandidate,
  type SkillActionState,
} from "@/app/actions/skill-actions";
import type { Option } from "@/components/skills/skill-forms";

const initialState: SkillActionState = {};
const READINESS = ["READY_NOW", "ONE_TO_TWO_YEARS", "THREE_PLUS_YEARS"] as const;
const textareaClassName =
  "w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30";

export const READINESS_KEY: Record<string, string> = {
  READY_NOW: "readyNow",
  ONE_TO_TWO_YEARS: "oneToTwo",
  THREE_PLUS_YEARS: "threePlus",
};

export function NewPlanForm({ employees }: { employees: Option[] }) {
  const t = useTranslations("succession");
  const [state, formAction, pending] = useActionState<SkillActionState, FormData>(upsertSuccessionPlan, initialState);
  if (employees.length === 0) return null;
  return (
    <Card>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>{t("roleHolder")}</Label>
              <Select name="roleHolderId" defaultValue={employees[0]?.id} items={Object.fromEntries(employees.map((e) => [e.id, e.name]))}>
                <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="plan-notes">{t("notes")}</Label>
            <textarea id="plan-notes" name="notes" rows={2} className={textareaClassName} />
          </div>
          <div>
            <Button type="submit" disabled={pending}>{t("createPlan")}</Button>
          </div>
          {state.error && <p className="text-sm text-destructive" role="alert">{t(state.error)}</p>}
        </form>
      </CardContent>
    </Card>
  );
}

export function AddCandidateForm({ planId, candidates }: { planId: string; candidates: Option[] }) {
  const t = useTranslations("succession");
  const bound = (p: SkillActionState, fd: FormData) => addSuccessionCandidate(p, fd);
  const [state, formAction, pending] = useActionState<SkillActionState, FormData>(bound, initialState);
  if (candidates.length === 0) return null;
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="planId" value={planId} />
      <div className="flex flex-col gap-1.5">
        <Label>{t("candidate")}</Label>
        <Select name="candidateId" defaultValue={candidates[0]?.id} items={Object.fromEntries(candidates.map((e) => [e.id, e.name]))}>
          <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
          <SelectContent>
            {candidates.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>{t("readiness")}</Label>
        <Select name="readiness" defaultValue="ONE_TO_TWO_YEARS" items={Object.fromEntries(READINESS.map((r) => [r, t(READINESS_KEY[r])]))}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            {READINESS.map((r) => <SelectItem key={r} value={r}>{t(READINESS_KEY[r])}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`cand-notes-${planId}`}>{t("notes")}</Label>
        <Input id={`cand-notes-${planId}`} name="notes" className="w-48" />
      </div>
      <Button type="submit" size="sm" disabled={pending}>{t("addCandidate")}</Button>
      {state.error && <p className="w-full text-sm text-destructive" role="alert">{t(state.error)}</p>}
    </form>
  );
}

function InlineDelete({ run, label, confirm }: { run: () => Promise<SkillActionState>; label: string; confirm?: string }) {
  const t = useTranslations("succession");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <span className="inline-flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
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
    </span>
  );
}

export function DeletePlanButton({ id }: { id: string }) {
  const t = useTranslations("succession");
  return <InlineDelete run={() => deleteSuccessionPlan(id)} label={t("deletePlan")} confirm={t("confirmDeletePlan")} />;
}
export function RemoveCandidateButton({ id }: { id: string }) {
  const t = useTranslations("succession");
  return <InlineDelete run={() => removeSuccessionCandidate(id)} label={t("remove")} />;
}
