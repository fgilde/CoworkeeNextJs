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
  createGoal,
  updateGoal,
  deleteGoal,
  updateOwnGoalProgress,
  type PerformanceActionState,
} from "@/app/actions/performance-actions";

const initialState: PerformanceActionState = {};

export type EmployeeOption = { id: string; name: string };

export type GoalFormValues = {
  id: string;
  title: string;
  description: string | null;
  status: "OPEN" | "IN_PROGRESS" | "DONE" | "CANCELLED";
  progress: number;
  dueDate: string | null; // yyyy-mm-dd
};

const GOAL_STATUSES = ["OPEN", "IN_PROGRESS", "DONE", "CANCELLED"] as const;

/** "New goal" form shown to managers/HR/ADMIN, scoped to their in-scope employees. */
export function NewGoalForm({ employees }: { employees: EmployeeOption[] }) {
  const t = useTranslations("performance");
  const [state, formAction, pending] = useActionState<PerformanceActionState, FormData>(createGoal, initialState);

  if (employees.length === 0) return null;

  return (
    <Card>
      <CardContent>
        <form action={formAction} className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>{t("employee")}</Label>
            <Select
              name="employeeId"
              defaultValue={employees[0]?.id}
              items={Object.fromEntries(employees.map((employee) => [employee.id, employee.name]))}
            >
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
            <Label htmlFor="new-goal-title">{t("goalTitle")}</Label>
            <Input id="new-goal-title" name="title" required className="w-48" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-goal-description">{t("description")}</Label>
            <Input id="new-goal-description" name="description" className="w-56" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-goal-dueDate">{t("dueDate")}</Label>
            <Input id="new-goal-dueDate" name="dueDate" type="date" className="w-40" />
          </div>
          <Button type="submit" disabled={pending}>
            {t("newGoal")}
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

/** Edit + delete controls for a team goal, shown to managers/HR/ADMIN. */
export function GoalControls({ goal }: { goal: GoalFormValues }) {
  const t = useTranslations("performance");
  const [editing, setEditing] = useState(false);
  const boundUpdate = (prevState: PerformanceActionState, formData: FormData) =>
    updateGoal(goal.id, prevState, formData);
  const [state, formAction, pending] = useActionState<PerformanceActionState, FormData>(boundUpdate, initialState);
  const [isDeleting, startDeleteTransition] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (editing) {
    return (
      <form action={formAction} className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${goal.id}-title`}>{t("goalTitle")}</Label>
          <Input id={`${goal.id}-title`} name="title" defaultValue={goal.title} required className="w-48" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${goal.id}-description`}>{t("description")}</Label>
          <Input
            id={`${goal.id}-description`}
            name="description"
            defaultValue={goal.description ?? ""}
            className="w-56"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>{t("status")}</Label>
          <Select
            name="status"
            defaultValue={goal.status}
            items={Object.fromEntries(GOAL_STATUSES.map((status) => [status, t(`goalStatus.${status}`)]))}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GOAL_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {t(`goalStatus.${status}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${goal.id}-progress`}>{t("progress")}</Label>
          <Input
            id={`${goal.id}-progress`}
            name="progress"
            type="number"
            min={0}
            max={100}
            defaultValue={goal.progress}
            required
            className="w-20"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${goal.id}-dueDate`}>{t("dueDate")}</Label>
          <Input
            id={`${goal.id}-dueDate`}
            name="dueDate"
            type="date"
            defaultValue={goal.dueDate ?? ""}
            className="w-40"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button type="submit" size="sm" disabled={pending}>
            {t("save")}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setEditing(false)}>
            {t("cancel")}
          </Button>
        </div>
        {state.error && (
          <p className="w-full text-sm text-destructive" role="alert">
            {t(state.error)}
          </p>
        )}
      </form>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
        {t("editGoal")}
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={isDeleting}
        onClick={() => {
          if (!window.confirm(t("confirmDeleteGoal"))) return;
          setDeleteError(null);
          startDeleteTransition(async () => {
            const result = await deleteGoal(goal.id);
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

/** Self-service progress control for an employee's own goal. */
export function OwnGoalProgress({ goal }: { goal: { id: string; progress: number } }) {
  const t = useTranslations("performance");
  const [value, setValue] = useState(goal.progress);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        min={0}
        max={100}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        disabled={isPending}
        className="w-20"
        aria-label={t("progress")}
      />
      <Button
        size="sm"
        disabled={isPending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await updateOwnGoalProgress(goal.id, value);
            if (result.error) setError(t(result.error));
          });
        }}
      >
        {t("save")}
      </Button>
      {error && (
        <span className="text-sm text-destructive" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

/** Simple horizontal progress bar (0-100). */
export function ProgressBar({ percent }: { percent: number }) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-28 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${clamped}%` }}
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      <span className="text-xs whitespace-nowrap text-muted-foreground tabular-nums">{clamped}%</span>
    </div>
  );
}
