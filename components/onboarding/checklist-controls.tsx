"use client";

import { useActionState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { checklistProgress } from "@/lib/checklist";
import {
  startChecklist,
  deleteChecklist,
  toggleTask,
  type OnboardingActionState,
} from "@/app/actions/onboarding-actions";

const initialState: OnboardingActionState = {};

export type EmployeeOption = { id: string; name: string };
export type TemplateOption = { id: string; name: string };

export function StartChecklistForm({
  employees,
  templates,
}: {
  employees: EmployeeOption[];
  templates: TemplateOption[];
}) {
  const t = useTranslations("onboarding");
  const [state, formAction, pending] = useActionState<OnboardingActionState, FormData>(startChecklist, initialState);

  if (employees.length === 0 || templates.length === 0) return null;

  return (
    <Card>
      <CardContent>
        <form action={formAction} className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <Select name="employeeId" defaultValue={employees[0]?.id}>
              <SelectTrigger className="w-56">
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
            <Select name="templateId" defaultValue={templates[0]?.id}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder={t("selectTemplate")} />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={pending}>
            {t("startProcess")}
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

export function DeleteChecklistButton({ id }: { id: string }) {
  const t = useTranslations("onboarding");
  const [isDeleting, startDeleteTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={isDeleting}
      onClick={() => {
        if (!window.confirm(t("confirmDelete"))) return;
        startDeleteTransition(async () => {
          await deleteChecklist(id);
        });
      }}
    >
      {t("delete")}
    </Button>
  );
}

export function TaskToggle({ task }: { task: { id: string; title: string; done: boolean } }) {
  const [isPending, startTransition] = useTransition();

  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={task.done}
        disabled={isPending}
        onChange={() => startTransition(async () => { await toggleTask(task.id); })}
        className="size-4 rounded border-input"
      />
      <span className={task.done ? "text-muted-foreground line-through" : undefined}>{task.title}</span>
    </label>
  );
}

export function ChecklistProgressBadge({ tasks }: { tasks: { done: boolean }[] }) {
  const { done, total, percent } = checklistProgress(tasks);
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-28 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${percent}%` }}
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      <span className="text-xs whitespace-nowrap text-muted-foreground tabular-nums">
        {done}/{total} · {percent}%
      </span>
    </div>
  );
}

export function ChecklistTypeBadge({ type }: { type: "ONBOARDING" | "OFFBOARDING" }) {
  const t = useTranslations("onboarding");
  return <Badge variant={type === "ONBOARDING" ? "default" : "secondary"}>{t(type.toLowerCase())}</Badge>;
}

export function ChecklistLink({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <Link href={`/onboarding/${id}`} className="font-medium text-primary hover:underline">
      {children}
    </Link>
  );
}
