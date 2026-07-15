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

export type CrudField = { name: string; label: string; required?: boolean };
export type CrudItem = { id: string } & Record<string, string | null>;
type ActionState = { error?: string };

export type CrudSectionLabels = {
  add: string;
  save: string;
  cancel: string;
  edit: string;
  delete: string;
  empty: string;
};

export type CrudSectionProps = {
  title: string;
  fields: CrudField[];
  items: CrudItem[];
  createAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  updateAction: (id: string, prevState: ActionState, formData: FormData) => Promise<ActionState>;
  deleteAction: (id: string) => Promise<ActionState>;
  labels: CrudSectionLabels;
  errorMessages: Record<string, string>;
};

function resolveError(code: string | undefined, messages: Record<string, string>): string | null {
  if (!code) return null;
  return messages[code] ?? code;
}

function AddForm({
  fields,
  createAction,
  labels,
  errorMessages,
}: Pick<CrudSectionProps, "fields" | "createAction" | "labels" | "errorMessages">) {
  const [state, formAction, pending] = useActionState(createAction, {});

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3 border-b border-border pb-4">
      {fields.map((f) => (
        <div key={f.name} className="flex flex-col gap-1.5">
          <Label htmlFor={`new-${f.name}`} className="text-xs text-muted-foreground">
            {f.label}
          </Label>
          <Input id={`new-${f.name}`} name={f.name} required={f.required} className="h-8 w-40" />
        </div>
      ))}
      <Button type="submit" size="sm" disabled={pending}>
        {labels.add}
      </Button>
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
  fields,
  updateAction,
  deleteAction,
  labels,
  errorMessages,
}: {
  item: CrudItem;
  fields: CrudField[];
  updateAction: CrudSectionProps["updateAction"];
  deleteAction: CrudSectionProps["deleteAction"];
  labels: CrudSectionLabels;
  errorMessages: Record<string, string>;
}) {
  const [editing, setEditing] = useState(false);
  const boundUpdate = (prevState: ActionState, formData: FormData) => updateAction(item.id, prevState, formData);
  const [state, formAction, pending] = useActionState(boundUpdate, {});
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  if (editing) {
    return (
      <TableRow>
        <TableCell colSpan={fields.length + 1}>
          <form action={formAction} className="flex flex-wrap items-end gap-3">
            {fields.map((f) => (
              <Input
                key={f.name}
                name={f.name}
                defaultValue={item[f.name] ?? ""}
                required={f.required}
                className="h-8 w-40"
              />
            ))}
            <Button type="submit" size="sm" disabled={pending}>
              {labels.save}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setEditing(false)}>
              {labels.cancel}
            </Button>
            {state.error && (
              <p className="w-full text-sm text-destructive" role="alert">
                {resolveError(state.error, errorMessages)}
              </p>
            )}
          </form>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow>
      {fields.map((f) => (
        <TableCell key={f.name}>{item[f.name] || "—"}</TableCell>
      ))}
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

export function CrudSection({
  title,
  fields,
  items,
  createAction,
  updateAction,
  deleteAction,
  labels,
  errorMessages,
}: CrudSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <AddForm fields={fields} createAction={createAction} labels={labels} errorMessages={errorMessages} />
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{labels.empty}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {fields.map((f) => (
                  <TableHead key={f.name}>{f.label}</TableHead>
                ))}
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <Row
                  key={item.id}
                  item={item}
                  fields={fields}
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
