"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cancelLeaveRequest } from "@/app/actions/leave-actions";

export function CancelLeaveRequestButton({ id }: { id: string }) {
  const t = useTranslations("absences");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={() => {
          if (!window.confirm(t("cancelConfirm"))) return;
          setError(null);
          startTransition(async () => {
            const result = await cancelLeaveRequest(id);
            if (result.error) setError(t(result.error));
          });
        }}
      >
        {t("cancel")}
      </Button>
      {error && (
        <span className="text-sm text-destructive" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
