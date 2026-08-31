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
import { cn } from "@/lib/utils";
import {
  createSkill,
  deleteSkill,
  setEmployeeSkill,
  type SkillActionState,
} from "@/app/actions/skill-actions";

const initialState: SkillActionState = {};

export type Option = { id: string; name: string };

export function NewSkillForm() {
  const t = useTranslations("skills");
  const [state, formAction, pending] = useActionState<SkillActionState, FormData>(createSkill, initialState);
  return (
    <Card>
      <CardContent>
        <form action={formAction} className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="skill-name">{t("skillName")}</Label>
            <Input id="skill-name" name="name" required className="w-56" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="skill-cat">{t("category")}</Label>
            <Input id="skill-cat" name="category" className="w-48" />
          </div>
          <Button type="submit" disabled={pending}>{t("addSkill")}</Button>
          {state.error && <p className="w-full text-sm text-destructive" role="alert">{t(state.error)}</p>}
        </form>
      </CardContent>
    </Card>
  );
}

export function DeleteSkillButton({ id }: { id: string }) {
  const t = useTranslations("skills");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => {
          if (!window.confirm(t("confirmDeleteSkill"))) return;
          setError(null);
          start(async () => {
            const r = await deleteSkill(id);
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

/** Click a level 0–5 for one (employee, skill); 0 clears the rating. */
export function SkillRater({
  employeeId,
  skillId,
  level,
  editable = true,
}: {
  employeeId: string;
  skillId: string;
  level: number;
  editable?: boolean;
}) {
  const [pending, start] = useTransition();
  const [current, setCurrent] = useState(level);

  if (!editable) {
    return <span className="text-sm font-medium">{level > 0 ? `${level}/5` : "—"}</span>;
  }

  const set = (n: number) => {
    if (pending) return;
    setCurrent(n);
    start(async () => {
      const fd = new FormData();
      fd.set("employeeId", employeeId);
      fd.set("skillId", skillId);
      fd.set("level", String(n));
      await setEmployeeSkill(initialState, fd);
    });
  };

  return (
    <div className={cn("flex gap-1", pending && "opacity-60")}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`${n}`}
          onClick={() => set(current === n ? 0 : n)}
          className={cn(
            "flex size-6 items-center justify-center rounded border text-xs transition-colors",
            n <= current ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"
          )}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

/** Managers/HR rate a chosen team member on a chosen skill. */
export function TeamRatingForm({ employees, skills }: { employees: Option[]; skills: Option[] }) {
  const t = useTranslations("skills");
  const [state, formAction, pending] = useActionState<SkillActionState, FormData>(setEmployeeSkill, initialState);
  if (employees.length === 0 || skills.length === 0) return null;
  return (
    <Card>
      <CardContent>
        <form action={formAction} className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>{t("employee")}</Label>
            <Select name="employeeId" defaultValue={employees[0]?.id} items={Object.fromEntries(employees.map((e) => [e.id, e.name]))}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t("skill")}</Label>
            <Select name="skillId" defaultValue={skills[0]?.id} items={Object.fromEntries(skills.map((s) => [s.id, s.name]))}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                {skills.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t("level")}</Label>
            <Select name="level" defaultValue="3" items={{ "0": t("clear"), "1": "1", "2": "2", "3": "3", "4": "4", "5": "5" }}>
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">{t("clear")}</SelectItem>
                {[1, 2, 3, 4, 5].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={pending}>{t("saveRating")}</Button>
          {state.error && <p className="w-full text-sm text-destructive" role="alert">{t(state.error)}</p>}
        </form>
      </CardContent>
    </Card>
  );
}
