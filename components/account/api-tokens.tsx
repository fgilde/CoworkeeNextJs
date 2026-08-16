"use client";

import { useActionState, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import {
  createApiToken,
  revokeApiToken,
  type ApiTokenActionState,
} from "@/app/actions/api-token-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type ApiTokenRow = {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsedAt: string | null;
};

const empty: ApiTokenActionState = {};

export function ApiTokens({ tokens }: { tokens: ApiTokenRow[] }) {
  const t = useTranslations("account");
  const format = useFormatter();
  const [createState, createAction, creating] = useActionState(createApiToken, empty);
  const [revokeState, revokeAction] = useActionState(revokeApiToken, empty);
  const [copied, setCopied] = useState(false);

  const fmt = (d: string | null) => (d ? format.dateTime(new Date(d), { dateStyle: "medium" }) : "—");

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">{t("apiTokensHelp")}</p>

      <form action={createAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="token-name">{t("tokenName")}</Label>
          <Input id="token-name" name="name" placeholder={t("tokenNamePlaceholder")} required />
        </div>
        <Button type="submit" disabled={creating}>
          {t("createToken")}
        </Button>
      </form>

      {createState.error && (
        <p className="text-sm text-destructive" role="alert">
          {t(createState.error)}
        </p>
      )}

      {createState.ok && createState.raw && (
        <div className="flex flex-col gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/40">
          <p className="text-sm font-medium">{t("tokenCreatedOnce")}</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 overflow-x-auto rounded bg-background px-2 py-1 text-xs">{createState.raw}</code>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(createState.raw!).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                });
              }}
            >
              {copied ? t("copied") : t("copy")}
            </Button>
          </div>
        </div>
      )}

      {revokeState.error && (
        <p className="text-sm text-destructive" role="alert">
          {t(revokeState.error)}
        </p>
      )}

      {tokens.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noTokens")}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("tokenName")}</TableHead>
              <TableHead>{t("tokenPrefix")}</TableHead>
              <TableHead>{t("tokenCreated")}</TableHead>
              <TableHead>{t("tokenLastUsed")}</TableHead>
              <TableHead className="text-right">{t("tokenActions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tokens.map((tok) => (
              <TableRow key={tok.id}>
                <TableCell>{tok.name}</TableCell>
                <TableCell><code className="text-xs">{tok.prefix}…</code></TableCell>
                <TableCell>{fmt(tok.createdAt)}</TableCell>
                <TableCell>{fmt(tok.lastUsedAt)}</TableCell>
                <TableCell className="text-right">
                  <form action={revokeAction}>
                    <input type="hidden" name="id" value={tok.id} />
                    <Button type="submit" variant="outline" size="sm">
                      {t("revokeToken")}
                    </Button>
                  </form>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
