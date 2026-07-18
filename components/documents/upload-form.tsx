"use client";

import { useActionState, useRef } from "react";
import { useTranslations } from "next-intl";
import { uploadDocument, type DocumentActionState } from "@/app/actions/document-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

const CATEGORIES = ["CONTRACT", "PAYSLIP", "CERTIFICATE", "ID", "OTHER"] as const;

export type EmployeeOption = { id: string; name: string };

const initialState: DocumentActionState = {};

export function UploadForm({
  employees,
  defaultEmployeeId,
}: {
  employees: EmployeeOption[];
  defaultEmployeeId?: string;
}) {
  const t = useTranslations("documents");
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(async (prev: DocumentActionState, formData: FormData) => {
    const result = await uploadDocument(prev, formData);
    if (!result.error) formRef.current?.reset();
    return result;
  }, initialState);

  return (
    <Card>
      <CardContent>
        <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="employeeId">{t("employee")}</Label>
            <Select
              name="employeeId"
              defaultValue={defaultEmployeeId ?? employees[0]?.id}
              items={Object.fromEntries(employees.map((employee) => [employee.id, employee.name]))}
            >
              <SelectTrigger id="employeeId" className="w-48">
                <SelectValue placeholder={t("employee")} />
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
            <Label htmlFor="title">{t("fileName")}</Label>
            <Input id="title" name="title" required className="h-9 w-48" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="category">{t("category")}</Label>
            <Select
              name="category"
              defaultValue="OTHER"
              items={Object.fromEntries(CATEGORIES.map((category) => [category, t(`categories.${category}`)]))}
            >
              <SelectTrigger id="category" className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {t(`categories.${category}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="file">{t("selectFile")}</Label>
            <input
              id="file"
              name="file"
              type="file"
              required
              className="h-9 w-56 rounded-md border border-input bg-transparent px-3 py-1.5 text-sm file:mr-3 file:rounded-sm file:border-0 file:bg-secondary file:px-2 file:py-1 file:text-xs"
            />
          </div>

          <Button type="submit" disabled={pending}>
            {t("upload")}
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
