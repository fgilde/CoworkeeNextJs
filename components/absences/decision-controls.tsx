"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { decideLeaveRequest } from "@/app/actions/leave-actions";

export function DecisionControls({ id }: { id: string }) {
  const t = useTranslations("absences");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const decide = (decision: "APPROVED" | "REJECTED") => {
    setError(null);
    startTransition(async () => {
      const result = await decideLeaveRequest(id, decision, note || undefined);
      if (result.error) setError(t(result.error));
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <Input
        placeholder={t("decisionNote")}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        disabled={isPending}
        className="h-8 text-sm"
      />
      <div className="flex gap-2">
        <Button size="sm" disabled={isPending} onClick={() => decide("APPROVED")}>
          {t("approve")}
        </Button>
        <Button size="sm" variant="outline" disabled={isPending} onClick={() => decide("REJECTED")}>
          {t("reject")}
        </Button>
      </div>
      {error && (
        <span className="text-sm text-destructive" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
