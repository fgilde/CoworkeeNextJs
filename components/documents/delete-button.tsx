"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { deleteDocument } from "@/app/actions/document-actions";
import { Button } from "@/components/ui/button";

export function DeleteButton({ id }: { id: string }) {
  const t = useTranslations("documents");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!window.confirm(t("deleteConfirm"))) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteDocument(id);
      if (result.error) setError(t(result.error));
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <Button size="sm" variant="outline" disabled={pending} onClick={handleDelete}>
        {t("delete")}
      </Button>
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
