"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { stageOrder, pipelineCounts } from "@/lib/recruiting";
import { updateApplicationStage, deleteApplication } from "@/app/actions/recruiting-actions";
import { ApplicationEditForm, type ApplicationEditValues } from "./application-form";

export type PipelineApplication = ApplicationEditValues;

/** Per-card stage select — moves an application to a new pipeline stage on change. */
function StageSelect({ id, stage }: { id: string; stage: string }) {
  const t = useTranslations("recruiting");
  const [current, setCurrent] = useState(stage);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-1">
      <Select
        value={current}
        disabled={isPending}
        items={Object.fromEntries(stageOrder.map((s) => [s, t(`applicationStage.${s}`)]))}
        onValueChange={(value) => {
          const previous = current;
          setCurrent(value as string);
          setError(null);
          startTransition(async () => {
            const result = await updateApplicationStage(id, value as string);
            if (result.error) {
              setCurrent(previous);
              setError(t(result.error));
            }
          });
        }}
      >
        <SelectTrigger className="h-7 w-full text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {stageOrder.map((s) => (
            <SelectItem key={s} value={s}>
              {t(`applicationStage.${s}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <span className="text-xs text-destructive" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

function ApplicationCard({ application }: { application: PipelineApplication }) {
  const t = useTranslations("recruiting");
  const tCommon = useTranslations("common");
  const [editing, setEditing] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (editing) {
    return (
      <Card size="sm">
        <CardContent>
          <ApplicationEditForm application={application} onCancel={() => setEditing(false)} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-2">
        <p className="text-sm font-medium">
          {application.firstName} {application.lastName}
        </p>
        <p className="truncate text-xs text-muted-foreground">{application.email}</p>
        <p className="text-xs text-amber-500" aria-label={t("rating")}>
          {application.rating ? "★".repeat(application.rating) + "☆".repeat(5 - application.rating) : "—"}
        </p>
        <StageSelect id={application.id} stage={application.stage} />
        <div className="flex items-center gap-2">
          <Button size="xs" variant="outline" onClick={() => setEditing(true)}>
            {tCommon("edit")}
          </Button>
          <Button
            size="xs"
            variant="outline"
            disabled={isDeleting}
            onClick={() => {
              if (!window.confirm(t("confirmDeleteApplication"))) return;
              setDeleteError(null);
              startDeleteTransition(async () => {
                const result = await deleteApplication(application.id);
                if (result.error) setDeleteError(t(result.error));
              });
            }}
          >
            {t("delete")}
          </Button>
        </div>
        {deleteError && (
          <span className="text-xs text-destructive" role="alert">
            {deleteError}
          </span>
        )}
      </CardContent>
    </Card>
  );
}

/** Kanban-style pipeline: one horizontally-scrolling column per application stage. */
export function Pipeline({ applications }: { applications: PipelineApplication[] }) {
  const t = useTranslations("recruiting");
  const counts = pipelineCounts(applications);

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {stageOrder.map((stage) => {
        const stageApplications = applications.filter((a) => a.stage === stage);
        return (
          <div key={stage} className="flex w-64 shrink-0 flex-col gap-3">
            <div className="flex items-center justify-between gap-2 rounded-lg bg-muted px-3 py-2">
              <h3 className="text-sm font-semibold">{t(`applicationStage.${stage}`)}</h3>
              <span className="text-xs tabular-nums text-muted-foreground">{counts[stage]}</span>
            </div>
            <div className="flex flex-col gap-2">
              {stageApplications.map((application) => (
                <ApplicationCard key={application.id} application={application} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
