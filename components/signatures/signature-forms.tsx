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
  createSignatureRequest,
  signRequest,
  declineRequest,
  deleteRequest,
  type SignatureActionState,
} from "@/app/actions/signature-actions";

const initialState: SignatureActionState = {};

export type EmployeeOption = { id: string; name: string };

const textareaClassName =
  "w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30";

/** "New signature request" form shown to managers/HR/ADMIN. */
export function NewSignatureRequestForm({ employees }: { employees: EmployeeOption[] }) {
  const t = useTranslations("signatures");
  const [state, formAction, pending] = useActionState<SignatureActionState, FormData>(
    createSignatureRequest,
    initialState
  );

  if (employees.length === 0) return null;

  return (
    <Card>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>{t("signer")}</Label>
            <Select
              name="signerId"
              defaultValue={employees[0]?.id}
              items={Object.fromEntries(employees.map((employee) => [employee.id, employee.name]))}
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder={t("selectSigner")} />
              </SelectTrigger>
              <SelectContent>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-signature-title">{t("titleLabel")}</Label>
            <Input id="new-signature-title" name="title" required className="w-full max-w-md" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-signature-body">{t("bodyLabel")}</Label>
            <textarea id="new-signature-body" name="body" rows={5} required className={textareaClassName} />
          </div>
          <div>
            <Button type="submit" disabled={pending}>
              {t("createRequest")}
            </Button>
          </div>
          {state.error && (
            <p className="text-sm text-destructive" role="alert">
              {t(state.error)}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

/** Sign form for the signer: type your name + Sign, with a Decline button. */
export function SignForm({ id }: { id: string }) {
  const t = useTranslations("signatures");
  const [signedName, setSignedName] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`sign-name-${id}`}>{t("typeName")}</Label>
          <Input
            id={`sign-name-${id}`}
            value={signedName}
            onChange={(e) => setSignedName(e.target.value)}
            placeholder={t("typeNamePlaceholder")}
            className="w-64"
          />
        </div>
        <Button
          disabled={isPending || signedName.trim() === ""}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const result = await signRequest(id, signedName);
              if (result.error) setError(t(result.error));
            });
          }}
        >
          {t("sign")}
        </Button>
        <Button
          variant="outline"
          disabled={isPending}
          onClick={() => {
            if (!window.confirm(t("confirmDecline"))) return;
            setError(null);
            startTransition(async () => {
              const result = await declineRequest(id);
              if (result.error) setError(t(result.error));
            });
          }}
        >
          {t("decline")}
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

/** Delete control for a request, shown to the requester or HR/ADMIN. */
export function DeleteRequestButton({ id }: { id: string }) {
  const t = useTranslations("signatures");
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
            const result = await deleteRequest(id);
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
