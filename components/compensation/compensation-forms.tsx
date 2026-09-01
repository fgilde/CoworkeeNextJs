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
  addCompensation,
  deleteCompensation,
  type CompensationActionState,
} from "@/app/actions/compensation-actions";

const initialState: CompensationActionState = {};

export type EmployeeOption = { id: string; name: string };

const FREQUENCIES = ["MONTHLY", "YEARLY", "HOURLY"] as const;

/** "Add compensation" form shown to HR/ADMIN. */
export function CreateCompForm({ employees }: { employees: EmployeeOption[] }) {
  const t = useTranslations("compensation");
  const [state, formAction, pending] = useActionState<CompensationActionState, FormData>(
    addCompensation,
    initialState
  );

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
              items={Object.fromEntries(employees.map((e) => [e.id, e.name]))}
            >
              <SelectTrigger className="w-48">
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
            <Label htmlFor="comp-amount">{t("amount")}</Label>
            <Input
              id="comp-amount"
              name="amount"
              type="number"
              step="0.01"
              min="0"
              required
              className="w-32"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="comp-currency">{t("currency")}</Label>
            <Input id="comp-currency" name="currency" defaultValue="EUR" className="w-20" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t("frequencyLabel")}</Label>
            <Select
              name="frequency"
              defaultValue="MONTHLY"
              items={Object.fromEntries(FREQUENCIES.map((f) => [f, t(`frequency.${f}`)]))}
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCIES.map((f) => (
                  <SelectItem key={f} value={f}>
                    {t(`frequency.${f}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="comp-date">{t("effectiveDate")}</Label>
            <Input id="comp-date" name="effectiveDate" type="date" required className="w-40" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="comp-note">{t("note")}</Label>
            <Input id="comp-note" name="note" className="w-48" />
          </div>
          <Button type="submit" disabled={pending}>
            {t("addCompensation")}
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

/** Delete control for a compensation record, shown to HR/ADMIN. */
export function DeleteCompButton({ id }: { id: string }) {
  const t = useTranslations("compensation");
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
            const result = await deleteCompensation(id);
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
