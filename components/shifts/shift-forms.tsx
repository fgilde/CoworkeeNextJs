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
import { createShift, deleteShift, type ShiftActionState } from "@/app/actions/shift-actions";

const initialState: ShiftActionState = {};

export type EmployeeOption = { id: string; name: string };

/** "Schedule a shift" form shown to managers/HR/ADMIN, scoped to their in-scope employees. */
export function NewShiftForm({ employees }: { employees: EmployeeOption[] }) {
  const t = useTranslations("shifts");
  const [state, formAction, pending] = useActionState<ShiftActionState, FormData>(createShift, initialState);

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
            <Label htmlFor="new-shift-date">{t("date")}</Label>
            <Input id="new-shift-date" name="date" type="date" required className="w-40" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-shift-start">{t("start")}</Label>
            <Input id="new-shift-start" name="start" type="time" required className="w-32" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-shift-end">{t("end")}</Label>
            <Input id="new-shift-end" name="end" type="time" required className="w-32" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-shift-role">{t("role")}</Label>
            <Input id="new-shift-role" name="role" className="w-40" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-shift-location">{t("location")}</Label>
            <Input id="new-shift-location" name="location" className="w-40" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-shift-note">{t("note")}</Label>
            <Input id="new-shift-note" name="note" className="w-56" />
          </div>
          <Button type="submit" disabled={pending}>
            {t("schedule")}
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

/** Delete control for a shift, shown to managers/HR/ADMIN in the team view. */
export function DeleteShiftButton({ id }: { id: string }) {
  const t = useTranslations("shifts");
  const [isDeleting, startDeleteTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={isDeleting}
        onClick={() => {
          if (!window.confirm(t("confirmDelete"))) return;
          setError(null);
          startDeleteTransition(async () => {
            const result = await deleteShift(id);
            if (result.error) setError(t(result.error));
          });
        }}
      >
        {t("delete")}
      </Button>
      {error && (
        <span className="text-sm text-destructive" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
