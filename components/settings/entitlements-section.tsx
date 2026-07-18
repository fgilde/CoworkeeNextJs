"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { setEntitlement } from "@/app/actions/leave-settings-actions";

export type EntitlementsSectionLabels = {
  title: string;
  employee: string;
  type: string;
  year: string;
  days: string;
  submit: string;
  empty: string;
};

export type EntitlementRow = {
  id: string;
  employeeName: string;
  typeName: string;
  days: number;
};

export function EntitlementsSection({
  employees,
  leaveTypes,
  entitlements,
  year,
  labels,
  errorMessages,
}: {
  employees: { id: string; name: string }[];
  leaveTypes: { id: string; name: string }[];
  entitlements: EntitlementRow[];
  year: number;
  labels: EntitlementsSectionLabels;
  errorMessages: Record<string, string>;
}) {
  const [state, formAction, pending] = useActionState(setEntitlement, {});

  return (
    <Card>
      <CardHeader>
        <CardTitle>{labels.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form action={formAction} className="flex flex-wrap items-end gap-3 border-b border-border pb-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ent-employee" className="text-xs text-muted-foreground">
              {labels.employee}
            </Label>
            <Select
              name="employeeId"
              defaultValue={employees[0]?.id}
              items={Object.fromEntries(employees.map((e) => [e.id, e.name]))}
            >
              <SelectTrigger id="ent-employee" className="w-48">
                <SelectValue />
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
            <Label htmlFor="ent-type" className="text-xs text-muted-foreground">
              {labels.type}
            </Label>
            <Select
              name="typeId"
              defaultValue={leaveTypes[0]?.id}
              items={Object.fromEntries(leaveTypes.map((lt) => [lt.id, lt.name]))}
            >
              <SelectTrigger id="ent-type" className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {leaveTypes.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ent-year" className="text-xs text-muted-foreground">
              {labels.year}
            </Label>
            <Input id="ent-year" name="year" type="number" defaultValue={year} required className="h-8 w-24" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ent-days" className="text-xs text-muted-foreground">
              {labels.days}
            </Label>
            <Input id="ent-days" name="days" type="number" min={0} step={0.5} required className="h-8 w-24" />
          </div>
          <Button type="submit" size="sm" disabled={pending}>
            {labels.submit}
          </Button>
          {state.error && (
            <p className="w-full text-sm text-destructive" role="alert">
              {errorMessages[state.error] ?? state.error}
            </p>
          )}
        </form>

        {entitlements.length === 0 ? (
          <p className="text-sm text-muted-foreground">{labels.empty}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{labels.employee}</TableHead>
                <TableHead>{labels.type}</TableHead>
                <TableHead>{labels.days}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entitlements.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.employeeName}</TableCell>
                  <TableCell>{row.typeName}</TableCell>
                  <TableCell>{row.days}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
