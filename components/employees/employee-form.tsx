"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { createEmployee, updateEmployee, type EmployeeFormState } from "@/app/actions/employee-actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type EmployeeFormOption = { id: string; label: string };

export type EmployeeFormOptions = {
  departments: EmployeeFormOption[];
  positions: EmployeeFormOption[];
  locations: EmployeeFormOption[];
  managers: EmployeeFormOption[];
};

export type EmployeeFormInitial = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  birthDate?: string | null;
  street?: string | null;
  city?: string | null;
  country?: string | null;
  hireDate: string;
  exitDate?: string | null;
  contractType: string;
  workload: number;
  status: string;
  departmentId?: string | null;
  positionId?: string | null;
  locationId?: string | null;
  managerId?: string | null;
};

const initialState: EmployeeFormState = {};

export function EmployeeForm({
  mode,
  id,
  initial,
  options,
}: {
  mode: "create" | "edit";
  id?: string;
  initial?: EmployeeFormInitial;
  options: EmployeeFormOptions;
}) {
  const t = useTranslations("employees");
  const tc = useTranslations("common");
  const action = mode === "edit" ? updateEmployee.bind(null, id!) : createEmployee;
  const [state, formAction, pending] = useActionState(action, initialState);
  const fieldError = (field: string) => state.fieldErrors?.[field]?.length ? t("fieldInvalid") : null;
  const cancelHref = mode === "edit" ? `/employees/${id}` : "/employees";

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="firstName">{t("firstName")}</Label>
          <Input id="firstName" name="firstName" defaultValue={initial?.firstName} required aria-invalid={!!fieldError("firstName")} />
          {fieldError("firstName") && <p className="text-sm text-destructive">{fieldError("firstName")}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="lastName">{t("lastName")}</Label>
          <Input id="lastName" name="lastName" defaultValue={initial?.lastName} required aria-invalid={!!fieldError("lastName")} />
          {fieldError("lastName") && <p className="text-sm text-destructive">{fieldError("lastName")}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">{t("email")}</Label>
          <Input id="email" name="email" type="email" defaultValue={initial?.email} required aria-invalid={!!fieldError("email")} />
          {fieldError("email") && <p className="text-sm text-destructive">{fieldError("email")}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="phone">{t("phone")}</Label>
          <Input id="phone" name="phone" defaultValue={initial?.phone ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="birthDate">{t("birthDate")}</Label>
          <Input id="birthDate" name="birthDate" type="date" defaultValue={initial?.birthDate ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="street">{t("street")}</Label>
          <Input id="street" name="street" defaultValue={initial?.street ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="city">{t("city")}</Label>
          <Input id="city" name="city" defaultValue={initial?.city ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="country">{t("country")}</Label>
          <Input id="country" name="country" defaultValue={initial?.country ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="hireDate">{t("hireDate")}</Label>
          <Input id="hireDate" name="hireDate" type="date" defaultValue={initial?.hireDate} required aria-invalid={!!fieldError("hireDate")} />
          {fieldError("hireDate") && <p className="text-sm text-destructive">{fieldError("hireDate")}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="exitDate">{t("exitDate")}</Label>
          <Input id="exitDate" name="exitDate" type="date" defaultValue={initial?.exitDate ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contractType">{t("contractType")}</Label>
          <Select name="contractType" defaultValue={initial?.contractType ?? "PERMANENT"}>
            <SelectTrigger id="contractType" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PERMANENT">{t("contractTypes.PERMANENT")}</SelectItem>
              <SelectItem value="TEMPORARY">{t("contractTypes.TEMPORARY")}</SelectItem>
              <SelectItem value="INTERN">{t("contractTypes.INTERN")}</SelectItem>
              <SelectItem value="WORKING_STUDENT">{t("contractTypes.WORKING_STUDENT")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="workload">{t("workload")}</Label>
          <Input
            id="workload"
            name="workload"
            type="number"
            min={1}
            max={100}
            defaultValue={initial?.workload ?? 100}
            required
            aria-invalid={!!fieldError("workload")}
          />
          {fieldError("workload") && <p className="text-sm text-destructive">{fieldError("workload")}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="status">{t("status")}</Label>
          <Select name="status" defaultValue={initial?.status ?? "ACTIVE"}>
            <SelectTrigger id="status" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">{t("statusActive")}</SelectItem>
              <SelectItem value="INACTIVE">{t("statusInactive")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="departmentId">{t("department")}</Label>
          <Select name="departmentId" defaultValue={initial?.departmentId ?? "none"}>
            <SelectTrigger id="departmentId" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t("noneOption")}</SelectItem>
              {options.departments.map((d) => (
                <SelectItem key={d.id} value={d.id}>{d.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="positionId">{t("position")}</Label>
          <Select name="positionId" defaultValue={initial?.positionId ?? "none"}>
            <SelectTrigger id="positionId" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t("noneOption")}</SelectItem>
              {options.positions.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="locationId">{t("location")}</Label>
          <Select name="locationId" defaultValue={initial?.locationId ?? "none"}>
            <SelectTrigger id="locationId" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t("noneOption")}</SelectItem>
              {options.locations.map((l) => (
                <SelectItem key={l.id} value={l.id}>{l.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="managerId">{t("manager")}</Label>
          <Select name="managerId" defaultValue={initial?.managerId ?? "none"}>
            <SelectTrigger id="managerId" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t("noneOption")}</SelectItem>
              {options.managers.map((m) => (
                <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {state.error && (
        <p className="text-sm text-destructive" role="alert">
          {t(state.error)}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {tc("save")}
        </Button>
        <Link href={cancelHref} className={buttonVariants({ variant: "outline" })}>
          {tc("cancel")}
        </Link>
      </div>
    </form>
  );
}
