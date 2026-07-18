"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { createLeaveRequest, type LeaveRequestFormState } from "@/app/actions/leave-actions";
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

export type LeaveTypeOption = { id: string; name: string };

const initialState: LeaveRequestFormState = {};

export function LeaveRequestForm({ types }: { types: LeaveTypeOption[] }) {
  const t = useTranslations("absences");
  const tc = useTranslations("common");
  const [state, formAction, pending] = useActionState(createLeaveRequest, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="typeId">{t("type")}</Label>
          <Select
            name="typeId"
            defaultValue={types[0]?.id}
            items={Object.fromEntries(types.map((type) => [type.id, type.name]))}
          >
            <SelectTrigger id="typeId" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {types.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="startDate">{t("from")}</Label>
          <Input id="startDate" name="startDate" type="date" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="endDate">{t("to")}</Label>
          <Input id="endDate" name="endDate" type="date" required />
        </div>
        <div className="flex items-center gap-2">
          <input id="halfDayStart" name="halfDayStart" type="checkbox" className="size-4 rounded border-input" />
          <Label htmlFor="halfDayStart" className="font-normal">
            {t("halfDayStart")}
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <input id="halfDayEnd" name="halfDayEnd" type="checkbox" className="size-4 rounded border-input" />
          <Label htmlFor="halfDayEnd" className="font-normal">
            {t("halfDayEnd")}
          </Label>
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="reason">{t("reason")}</Label>
          <textarea
            id="reason"
            name="reason"
            rows={3}
            className="w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
          />
        </div>
      </div>

      {state.error && (
        <p className="text-sm text-destructive" role="alert">
          {t(state.error)}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {t("submit")}
        </Button>
        <Link href="/absences" className={buttonVariants({ variant: "outline" })}>
          {tc("cancel")}
        </Link>
      </div>
    </form>
  );
}
