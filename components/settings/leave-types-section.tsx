"use client";

import { useActionState, useState, useTransition } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type LeaveTypeItem = {
  id: string;
  name: string;
  colorHex: string;
  paid: boolean;
  defaultDays: number;
};

type ActionState = { error?: string };

export type LeaveTypesSectionLabels = {
  add: string;
  save: string;
  cancel: string;
  edit: string;
  delete: string;
  empty: string;
  fieldName: string;
  fieldColor: string;
  fieldPaid: string;
  fieldDefaultDays: string;
};

export type LeaveTypesSectionProps = {
  title: string;
  items: LeaveTypeItem[];
  createAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  updateAction: (id: string, prevState: ActionState, formData: FormData) => Promise<ActionState>;
  deleteAction: (id: string) => Promise<ActionState>;
  labels: LeaveTypesSectionLabels;
  errorMessages: Record<string, string>;
};

function resolveError(code: string | undefined, messages: Record<string, string>): string | null {
  if (!code) return null;
  return messages[code] ?? code;
}

function Swatch({ colorHex }: { colorHex: string }) {
  return (
    <span
      className="inline-block size-4 rounded-full border border-border align-middle"
      style={{ backgroundColor: colorHex }}
      aria-hidden
    />
  );
}

function TypeForm({
  item,
  onCancel,
  action,
  submitLabel,
  labels,
  errorMessages,
}: {
  item?: LeaveTypeItem;
  onCancel?: () => void;
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  submitLabel: string;
  labels: LeaveTypesSectionLabels;
  errorMessages: Record<string, string>;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${item?.id ?? "new"}-name`} className="text-xs text-muted-foreground">
          {labels.fieldName}
        </Label>
        <Input
          id={`${item?.id ?? "new"}-name`}
          name="name"
          defaultValue={item?.name}
          required
          className="h-8 w-40"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${item?.id ?? "new"}-color`} className="text-xs text-muted-foreground">
          {labels.fieldColor}
        </Label>
        <input
          id={`${item?.id ?? "new"}-color`}
          name="colorHex"
          type="color"
          defaultValue={item?.colorHex ?? "#6366f1"}
          className="h-8 w-14 rounded-md border border-input bg-background p-0.5"
        />
      </div>
      <div className="flex items-center gap-2 pb-1.5">
        <input
          id={`${item?.id ?? "new"}-paid`}
          name="paid"
          type="checkbox"
          defaultChecked={item?.paid ?? true}
          className="size-4 rounded border-input"
        />
        <Label htmlFor={`${item?.id ?? "new"}-paid`} className="font-normal">
          {labels.fieldPaid}
        </Label>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${item?.id ?? "new"}-defaultDays`} className="text-xs text-muted-foreground">
          {labels.fieldDefaultDays}
        </Label>
        <Input
          id={`${item?.id ?? "new"}-defaultDays`}
          name="defaultDays"
          type="number"
          min={0}
          step={1}
          defaultValue={item?.defaultDays ?? 0}
          required
          className="h-8 w-24"
        />
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        {submitLabel}
      </Button>
      {onCancel && (
        <Button type="button" size="sm" variant="outline" onClick={onCancel}>
          {labels.cancel}
        </Button>
      )}
      {state.error && (
        <p className="w-full text-sm text-destructive" role="alert">
          {resolveError(state.error, errorMessages)}
        </p>
      )}
    </form>
  );
}

function Row({
  item,
  updateAction,
  deleteAction,
  labels,
  errorMessages,
}: {
  item: LeaveTypeItem;
  updateAction: LeaveTypesSectionProps["updateAction"];
  deleteAction: LeaveTypesSectionProps["deleteAction"];
  labels: LeaveTypesSectionLabels;
  errorMessages: Record<string, string>;
}) {
  const [editing, setEditing] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();
  const boundUpdate = (prevState: ActionState, formData: FormData) => updateAction(item.id, prevState, formData);

  if (editing) {
    return (
      <TableRow>
        <TableCell colSpan={5}>
          <TypeForm
            item={item}
            onCancel={() => setEditing(false)}
            action={boundUpdate}
            submitLabel={labels.save}
            labels={labels}
            errorMessages={errorMessages}
          />
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow>
      <TableCell>
        <Swatch colorHex={item.colorHex} /> <span className="ml-2 align-middle">{item.name}</span>
      </TableCell>
      <TableCell>{item.paid ? labels.fieldPaid : "—"}</TableCell>
      <TableCell>{item.defaultDays}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
            {labels.edit}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={isDeleting}
            onClick={() => {
              setDeleteError(null);
              startDeleteTransition(async () => {
                const result = await deleteAction(item.id);
                if (result.error) setDeleteError(resolveError(result.error, errorMessages));
              });
            }}
          >
            {labels.delete}
          </Button>
          {deleteError && <span className="text-sm text-destructive">{deleteError}</span>}
        </div>
      </TableCell>
    </TableRow>
  );
}

export function LeaveTypesSection({
  title,
  items,
  createAction,
  updateAction,
  deleteAction,
  labels,
  errorMessages,
}: LeaveTypesSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="border-b border-border pb-4">
          <TypeForm action={createAction} submitLabel={labels.add} labels={labels} errorMessages={errorMessages} />
        </div>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{labels.empty}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{labels.fieldName}</TableHead>
                <TableHead>{labels.fieldPaid}</TableHead>
                <TableHead>{labels.fieldDefaultDays}</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <Row
                  key={item.id}
                  item={item}
                  updateAction={updateAction}
                  deleteAction={deleteAction}
                  labels={labels}
                  errorMessages={errorMessages}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
