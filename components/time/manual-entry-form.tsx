"use client";

import { useActionState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { createManualEntry, updateEntry, type TimeActionState } from "@/app/actions/time-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type ManualEntryInitial = {
  id: string;
  date: string; // yyyy-mm-dd
  start: string; // HH:MM
  end: string; // HH:MM
  breakMinutes: number;
  note?: string | null;
};

const initialState: TimeActionState = {};

export function ManualEntryForm({
  initial,
  onDone,
}: {
  initial?: ManualEntryInitial;
  onDone?: () => void;
}) {
  const t = useTranslations("time");
  const tc = useTranslations("common");
  const action = initial ? updateEntry.bind(null, initial.id) : createManualEntry;
  const [state, formAction, pending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state !== initialState && !state.error) {
      onDone?.();
      if (!initial) formRef.current?.reset();
    }
    // Only re-run when the action result changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="date">{t("date")}</Label>
          <Input id="date" name="date" type="date" defaultValue={initial?.date} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="start">{t("start")}</Label>
          <Input id="start" name="start" type="time" defaultValue={initial?.start} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="end">{t("end")}</Label>
          <Input id="end" name="end" type="time" defaultValue={initial?.end} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="breakMinutes">{t("breakMinutes")}</Label>
          <Input
            id="breakMinutes"
            name="breakMinutes"
            type="number"
            min={0}
            defaultValue={initial?.breakMinutes ?? 0}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="note">{t("note")}</Label>
          <Input id="note" name="note" defaultValue={initial?.note ?? ""} />
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
        {initial && (
          <Button type="button" variant="outline" onClick={() => onDone?.()}>
            {tc("cancel")}
          </Button>
        )}
      </div>
    </form>
  );
}
