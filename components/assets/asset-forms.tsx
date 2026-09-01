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
  createAsset,
  assignAsset,
  returnAsset,
  retireAsset,
  deleteAsset,
  type AssetActionState,
} from "@/app/actions/asset-actions";

const initialState: AssetActionState = {};

export type EmployeeOption = { id: string; name: string };

/** "New asset" form shown to HR/ADMIN. */
export function CreateAssetForm() {
  const t = useTranslations("assets");
  const [state, formAction, pending] = useActionState<AssetActionState, FormData>(createAsset, initialState);

  return (
    <Card>
      <CardContent>
        <form action={formAction} className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-asset-name">{t("name")}</Label>
            <Input id="new-asset-name" name="name" required className="w-48" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-asset-category">{t("category")}</Label>
            <Input id="new-asset-category" name="category" className="w-40" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-asset-serialNumber">{t("serialNumber")}</Label>
            <Input id="new-asset-serialNumber" name="serialNumber" className="w-40" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-asset-notes">{t("notes")}</Label>
            <Input id="new-asset-notes" name="notes" className="w-56" />
          </div>
          <Button type="submit" disabled={pending}>
            {t("newAsset")}
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

/** Assign an AVAILABLE asset to an active employee (HR/ADMIN). */
export function AssignAssetForm({ id, employees }: { id: string; employees: EmployeeOption[] }) {
  const t = useTranslations("assets");
  const [employeeId, setEmployeeId] = useState(employees[0]?.id ?? "");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (employees.length === 0) {
    return <span className="text-sm text-muted-foreground">{t("noActiveEmployees")}</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        name="employeeId"
        value={employeeId}
        onValueChange={(value) => setEmployeeId(value as string)}
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
      <Button
        size="sm"
        disabled={isPending || !employeeId}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await assignAsset(id, employeeId);
            if (result.error) setError(t(result.error));
          });
        }}
      >
        {t("assign")}
      </Button>
      {error && (
        <span className="text-sm text-destructive" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

/** Imperative action button shared by return/retire/delete controls. */
function ActionButton({
  label,
  confirmKey,
  run,
}: {
  label: string;
  confirmKey?: string;
  run: () => Promise<AssetActionState>;
}) {
  const t = useTranslations("assets");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={() => {
          if (confirmKey && !window.confirm(t(confirmKey))) return;
          setError(null);
          startTransition(async () => {
            const result = await run();
            if (result.error) setError(t(result.error));
          });
        }}
      >
        {t(label)}
      </Button>
      {error && (
        <span className="text-sm text-destructive" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

export function ReturnAssetButton({ id }: { id: string }) {
  return <ActionButton label="return" run={() => returnAsset(id)} />;
}

export function RetireAssetButton({ id }: { id: string }) {
  return <ActionButton label="retire" confirmKey="confirmRetire" run={() => retireAsset(id)} />;
}

export function DeleteAssetButton({ id }: { id: string }) {
  return <ActionButton label="delete" confirmKey="confirmDelete" run={() => deleteAsset(id)} />;
}
