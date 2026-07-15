"use client";

import { useState, useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import { entryHours } from "@/lib/time";
import { deleteEntry } from "@/app/actions/time-actions";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ManualEntryForm, type ManualEntryInitial } from "./manual-entry-form";

export type TimeEntryDTO = {
  id: string;
  date: string; // ISO
  start: string; // ISO
  end: string | null; // ISO
  breakMinutes: number;
  note: string | null;
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toHHMM(iso: string): string {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toDateInput(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function TimeEntriesSection({ entries }: { entries: TimeEntryDTO[] }) {
  const t = useTranslations("time");
  const locale = useLocale();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
  const timeFormatter = new Intl.DateTimeFormat(locale, { timeStyle: "short" });

  const editing = entries.find((e) => e.id === editingId);
  const editingInitial: ManualEntryInitial | undefined = editing
    ? {
        id: editing.id,
        date: toDateInput(editing.date),
        start: toHHMM(editing.start),
        end: editing.end ? toHHMM(editing.end) : "",
        breakMinutes: editing.breakMinutes,
        note: editing.note,
      }
    : undefined;

  const handleDelete = (id: string) => {
    if (!window.confirm(t("deleteConfirm"))) return;
    setDeleteError(null);
    startTransition(async () => {
      const result = await deleteEntry(id);
      if (result.error) setDeleteError(t(result.error));
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noEntries")}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("date")}</TableHead>
              <TableHead>
                {t("start")}–{t("end")}
              </TableHead>
              <TableHead>{t("break")}</TableHead>
              <TableHead>{t("hours")}</TableHead>
              <TableHead>{t("note")}</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((e) => {
              const start = new Date(e.start);
              const end = e.end ? new Date(e.end) : null;
              return (
                <TableRow key={e.id}>
                  <TableCell>{dateFormatter.format(new Date(e.date))}</TableCell>
                  <TableCell>
                    {timeFormatter.format(start)}–{end ? timeFormatter.format(end) : t("inProgress")}
                  </TableCell>
                  <TableCell className="tabular-nums">{e.breakMinutes}</TableCell>
                  <TableCell className="tabular-nums">
                    {end ? entryHours(start, end, e.breakMinutes) : t("inProgress")}
                  </TableCell>
                  <TableCell className="max-w-48 truncate">{e.note ?? "—"}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => setEditingId(e.id)}>
                        {t("edit")}
                      </Button>
                      <Button size="sm" variant="outline" disabled={isPending} onClick={() => handleDelete(e.id)}>
                        {t("delete")}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
      {deleteError && (
        <p className="text-sm text-destructive" role="alert">
          {deleteError}
        </p>
      )}

      <div className="flex flex-col gap-2 border-t border-border pt-4">
        <h3 className="text-sm font-medium">{editingInitial ? t("edit") : t("addEntry")}</h3>
        <ManualEntryForm
          key={editingId ?? "new"}
          initial={editingInitial}
          onDone={() => setEditingId(null)}
        />
      </div>
    </div>
  );
}
