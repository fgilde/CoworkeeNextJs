"use client";

import { useActionState, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  type AnnouncementActionState,
} from "@/app/actions/announcement-actions";

export type AnnouncementFormValues = {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
};

function Fields({ announcement, idPrefix }: { announcement?: AnnouncementFormValues; idPrefix: string }) {
  const t = useTranslations("news");
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-title`}>{t("titleLabel")}</Label>
        <Input id={`${idPrefix}-title`} name="title" defaultValue={announcement?.title} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-body`}>{t("body")}</Label>
        <textarea
          id={`${idPrefix}-body`}
          name="body"
          rows={5}
          defaultValue={announcement?.body}
          required
          className="w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          id={`${idPrefix}-pinned`}
          name="pinned"
          type="checkbox"
          defaultChecked={announcement?.pinned ?? false}
          className="size-4 rounded border-input"
        />
        <Label htmlFor={`${idPrefix}-pinned`} className="font-normal">
          {t("pinned")}
        </Label>
      </div>
    </div>
  );
}

/** Inline "New announcement" button that reveals a create form. */
export function NewAnnouncementButton() {
  const t = useTranslations("news");
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<AnnouncementActionState, FormData>(createAnnouncement, {});

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>{t("newAnnouncement")}</Button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <Fields idPrefix="new" />
      {state.error && (
        <p className="text-sm text-destructive" role="alert">
          {t(state.error)}
        </p>
      )}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {t("publish")}
        </Button>
        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
          {t("cancel")}
        </Button>
      </div>
    </form>
  );
}

/** Per-card edit + delete controls, shown to privileged users. */
export function AnnouncementControls({ announcement }: { announcement: AnnouncementFormValues }) {
  const t = useTranslations("news");
  const [editing, setEditing] = useState(false);
  const boundUpdate = (prevState: AnnouncementActionState, formData: FormData) =>
    updateAnnouncement(announcement.id, prevState, formData);
  const [state, formAction, pending] = useActionState<AnnouncementActionState, FormData>(boundUpdate, {});
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  if (editing) {
    return (
      <form action={formAction} className="flex flex-col gap-3">
        <Fields announcement={announcement} idPrefix={announcement.id} />
        {state.error && (
          <p className="text-sm text-destructive" role="alert">
            {t(state.error)}
          </p>
        )}
        <div className="flex items-center gap-3">
          <Button type="submit" size="sm" disabled={pending}>
            {t("save")}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setEditing(false)}>
            {t("cancel")}
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
        {t("editAnnouncement")}
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={isDeleting}
        onClick={() => {
          if (!window.confirm(t("confirmDelete"))) return;
          setDeleteError(null);
          startDeleteTransition(async () => {
            const result = await deleteAnnouncement(announcement.id);
            if (result.error) setDeleteError(t(result.error));
          });
        }}
      >
        {t("delete")}
      </Button>
      {deleteError && (
        <span className="text-sm text-destructive" role="alert">
          {deleteError}
        </span>
      )}
    </div>
  );
}
