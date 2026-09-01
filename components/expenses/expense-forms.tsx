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
  submitExpense,
  decideExpense,
  markReimbursed,
  deleteExpense,
  type ExpenseActionState,
} from "@/app/actions/expense-actions";

const initialState: ExpenseActionState = {};

const CURRENCIES = ["EUR", "USD", "GBP", "CHF"] as const;

export const EXPENSE_STATUS_KEY: Record<string, string> = {
  PENDING: "status.pending",
  APPROVED: "status.approved",
  REJECTED: "status.rejected",
  REIMBURSED: "status.reimbursed",
};

/** Self-service form: any authenticated employee submits an expense for themselves. */
export function SubmitExpenseForm() {
  const t = useTranslations("expenses");
  const [state, formAction, pending] = useActionState<ExpenseActionState, FormData>(submitExpense, initialState);

  return (
    <Card>
      <CardContent>
        <form action={formAction} className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-expense-title">{t("expenseTitle")}</Label>
            <Input id="new-expense-title" name="title" required className="w-48" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-expense-category">{t("category")}</Label>
            <Input id="new-expense-category" name="category" className="w-40" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-expense-amount">{t("amount")}</Label>
            <Input
              id="new-expense-amount"
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              required
              className="w-28"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t("currency")}</Label>
            <Select
              name="currency"
              defaultValue="EUR"
              items={Object.fromEntries(CURRENCIES.map((c) => [c, c]))}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-expense-spentAt">{t("spentAt")}</Label>
            <Input id="new-expense-spentAt" name="spentAt" type="date" required className="w-40" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-expense-note">{t("note")}</Label>
            <Input id="new-expense-note" name="note" className="w-56" />
          </div>
          <Button type="submit" disabled={pending}>
            {t("submit")}
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

/** Approve/Reject controls for a pending team expense, shown to managers/HR/ADMIN. */
export function DecideExpenseButtons({ id }: { id: string }) {
  const t = useTranslations("expenses");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const decide = (decision: "APPROVED" | "REJECTED") => {
    setError(null);
    startTransition(async () => {
      const result = await decideExpense(id, decision);
      if (result.error) setError(t(result.error));
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" disabled={isPending} onClick={() => decide("APPROVED")}>
        {t("approve")}
      </Button>
      <Button size="sm" variant="destructive" disabled={isPending} onClick={() => decide("REJECTED")}>
        {t("reject")}
      </Button>
      {error && (
        <span className="text-sm text-destructive" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

/** "Mark reimbursed" control for an approved expense, shown to HR/ADMIN. */
export function MarkReimbursedButton({ id }: { id: string }) {
  const t = useTranslations("expenses");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await markReimbursed(id);
            if (result.error) setError(t(result.error));
          });
        }}
      >
        {t("markReimbursed")}
      </Button>
      {error && (
        <span className="text-sm text-destructive" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

/** Delete control, shown to the owner while PENDING or to HR/ADMIN. */
export function DeleteExpenseButton({ id }: { id: string }) {
  const t = useTranslations("expenses");
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
            const result = await deleteExpense(id);
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
