"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createJobPosting,
  updateJobPosting,
  deleteJobPosting,
  type RecruitingActionState,
} from "@/app/actions/recruiting-actions";

const initialState: RecruitingActionState = {};

export type SelectOption = { id: string; name: string };
export type JobStatus = "DRAFT" | "OPEN" | "CLOSED";

const JOB_STATUSES: JobStatus[] = ["DRAFT", "OPEN", "CLOSED"];

// OPEN = positive (green), DRAFT = muted/outline, CLOSED = neutral flat.
const JOB_STATUS_STYLES: Record<JobStatus, string | undefined> = {
  OPEN: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  DRAFT: undefined,
  CLOSED: undefined,
};

export function JobStatusBadge({ status }: { status: JobStatus }) {
  const t = useTranslations("recruiting");
  return (
    <Badge variant={status === "DRAFT" ? "outline" : "secondary"} className={JOB_STATUS_STYLES[status]}>
      {t(`jobStatus.${status}`)}
    </Badge>
  );
}

export type PostingFormValues = {
  id: string;
  title: string;
  description: string;
  employmentType: string | null;
  departmentId: string | null;
  locationId: string | null;
  status: JobStatus;
};

const textareaClassName =
  "w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30";

function PostingFields({
  posting,
  idPrefix,
  departments,
  locations,
}: {
  posting?: PostingFormValues;
  idPrefix: string;
  departments: SelectOption[];
  locations: SelectOption[];
}) {
  const t = useTranslations("recruiting");
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-title`}>{t("jobTitle")}</Label>
        <Input id={`${idPrefix}-title`} name="title" defaultValue={posting?.title} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-description`}>{t("description")}</Label>
        <textarea
          id={`${idPrefix}-description`}
          name="description"
          rows={4}
          defaultValue={posting?.description}
          required
          className={textareaClassName}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-employmentType`}>{t("employmentType")}</Label>
        <Input
          id={`${idPrefix}-employmentType`}
          name="employmentType"
          defaultValue={posting?.employmentType ?? ""}
          className="w-56"
        />
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${idPrefix}-departmentId`}>{t("department")}</Label>
          <Select name="departmentId" defaultValue={posting?.departmentId ?? ""}>
            <SelectTrigger id={`${idPrefix}-departmentId`} className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">—</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${idPrefix}-locationId`}>{t("location")}</Label>
          <Select name="locationId" defaultValue={posting?.locationId ?? ""}>
            <SelectTrigger id={`${idPrefix}-locationId`} className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">—</SelectItem>
              {locations.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${idPrefix}-status`}>{t("status")}</Label>
          <Select name="status" defaultValue={posting?.status ?? "DRAFT"}>
            <SelectTrigger id={`${idPrefix}-status`} className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {JOB_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {t(`jobStatus.${status}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

/** Inline "New posting" button that reveals a create form. */
export function NewPostingForm({ departments, locations }: { departments: SelectOption[]; locations: SelectOption[] }) {
  const t = useTranslations("recruiting");
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<RecruitingActionState, FormData>(createJobPosting, initialState);

  if (!open) {
    return <Button onClick={() => setOpen(true)}>{t("newPosting")}</Button>;
  }

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <PostingFields idPrefix="new-posting" departments={departments} locations={locations} />
      {state.error && (
        <p className="text-sm text-destructive" role="alert">
          {t(state.error)}
        </p>
      )}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {t("save")}
        </Button>
        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
          {t("cancel")}
        </Button>
      </div>
    </form>
  );
}

function PostingEditForm({
  posting,
  departments,
  locations,
  onCancel,
}: {
  posting: PostingFormValues;
  departments: SelectOption[];
  locations: SelectOption[];
  onCancel: () => void;
}) {
  const t = useTranslations("recruiting");
  const boundUpdate = (prevState: RecruitingActionState, formData: FormData) =>
    updateJobPosting(posting.id, prevState, formData);
  const [state, formAction, pending] = useActionState<RecruitingActionState, FormData>(boundUpdate, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <PostingFields posting={posting} idPrefix={posting.id} departments={departments} locations={locations} />
      {state.error && (
        <p className="text-sm text-destructive" role="alert">
          {t(state.error)}
        </p>
      )}
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={pending}>
          {t("save")}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel}>
          {t("cancel")}
        </Button>
      </div>
    </form>
  );
}

function DeletePostingButton({ id }: { id: string }) {
  const t = useTranslations("recruiting");
  const router = useRouter();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={isDeleting}
        onClick={() => {
          if (!window.confirm(t("confirmDeletePosting"))) return;
          setError(null);
          startDeleteTransition(async () => {
            const result = await deleteJobPosting(id);
            if (result.error) {
              setError(t(result.error));
            } else {
              router.push("/recruiting");
            }
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

/** Posting detail header: title/status/dept/location display, with edit + delete controls. */
export function PostingHeader({
  posting,
  department,
  location,
  departments,
  locations,
}: {
  posting: PostingFormValues;
  department: string | null;
  location: string | null;
  departments: SelectOption[];
  locations: SelectOption[];
}) {
  const tCommon = useTranslations("common");
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <Card>
        <CardContent>
          <PostingEditForm
            posting={posting}
            departments={departments}
            locations={locations}
            onCancel={() => setEditing(false)}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{posting.title}</h1>
          <JobStatusBadge status={posting.status} />
        </div>
        <p className="text-sm text-muted-foreground">{[department, location].filter(Boolean).join(" · ") || "—"}</p>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
          {tCommon("edit")}
        </Button>
        <DeletePostingButton id={posting.id} />
      </div>
    </div>
  );
}
