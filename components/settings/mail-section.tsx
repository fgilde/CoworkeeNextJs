"use client";

import { useActionState, useState, useTransition } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { updateMailSettings, sendTestMail, type MailActionState } from "@/app/actions/mail-actions";

type Current = {
  provider: string;
  fromEmail: string;
  fromName: string;
  smtpHost: string;
  smtpPort: string;
  smtpSecure: boolean;
  smtpUser: string;
  hasSmtpPass: boolean;
  hasSendgridKey: boolean;
};

type Labels = {
  title: string;
  description: string;
  provider: string;
  providers: Record<string, string>;
  fromEmail: string;
  fromName: string;
  smtpHost: string;
  smtpPort: string;
  smtpSecure: string;
  smtpUser: string;
  smtpPass: string;
  sendgridKey: string;
  keepBlank: string;
  set: string;
  notSet: string;
  save: string;
  saved: string;
  sendTest: string;
  testSent: string;
  sendmailHint: string;
  logHint: string;
  errors: Record<string, string>;
};

export function MailSection({ current, labels }: { current: Current; labels: Labels }) {
  const [provider, setProvider] = useState(current.provider);
  const [state, formAction, saving] = useActionState<MailActionState, FormData>(updateMailSettings, {});
  const [testState, setTestState] = useState<MailActionState>({});
  const [testing, startTest] = useTransition();

  const err = (code?: string) => (code ? (labels.errors[code] ?? code) : null);
  const secretStatus = (has: boolean) => (has ? labels.set : labels.notSet);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{labels.title}</CardTitle>
        <CardDescription>{labels.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <form action={formAction} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="provider">{labels.provider}</Label>
            <select
              id="provider"
              name="provider"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            >
              {["LOG", "SMTP", "SENDGRID", "SENDMAIL"].map((p) => (
                <option key={p} value={p}>
                  {labels.providers[p]}
                </option>
              ))}
            </select>
            {provider === "SENDMAIL" && <p className="text-xs text-muted-foreground">{labels.sendmailHint}</p>}
            {provider === "LOG" && <p className="text-xs text-muted-foreground">{labels.logHint}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fromEmail">{labels.fromEmail}</Label>
              <Input id="fromEmail" name="fromEmail" type="email" defaultValue={current.fromEmail} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fromName">{labels.fromName}</Label>
              <Input id="fromName" name="fromName" defaultValue={current.fromName} />
            </div>
          </div>

          {provider === "SMTP" && (
            <div className="grid gap-4 rounded-lg border border-border p-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="smtpHost">{labels.smtpHost}</Label>
                <Input id="smtpHost" name="smtpHost" defaultValue={current.smtpHost} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="smtpPort">{labels.smtpPort}</Label>
                <Input id="smtpPort" name="smtpPort" type="number" defaultValue={current.smtpPort} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="smtpUser">{labels.smtpUser}</Label>
                <Input id="smtpUser" name="smtpUser" defaultValue={current.smtpUser} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="smtpPass">
                  {labels.smtpPass} <span className="text-xs text-muted-foreground">({secretStatus(current.hasSmtpPass)})</span>
                </Label>
                <Input id="smtpPass" name="smtpPass" type="password" placeholder={labels.keepBlank} autoComplete="new-password" />
              </div>
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input type="checkbox" name="smtpSecure" defaultChecked={current.smtpSecure} className="size-4 rounded border-input" />
                {labels.smtpSecure}
              </label>
            </div>
          )}

          {provider === "SENDGRID" && (
            <div className="flex flex-col gap-1.5 rounded-lg border border-border p-4">
              <Label htmlFor="sendgridKey">
                {labels.sendgridKey} <span className="text-xs text-muted-foreground">({secretStatus(current.hasSendgridKey)})</span>
              </Label>
              <Input id="sendgridKey" name="sendgridKey" type="password" placeholder={labels.keepBlank} autoComplete="new-password" />
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" aria-hidden />}
              {labels.save}
            </Button>
            {state.ok && !saving && <span className="text-sm text-muted-foreground">{labels.saved}</span>}
            {err(state.error) && (
              <span className="text-sm text-destructive" role="alert">
                {err(state.error)}
              </span>
            )}
          </div>
        </form>

        <div className="flex flex-wrap items-center gap-3 border-t border-border pt-6">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={testing}
            onClick={() => startTest(async () => setTestState(await sendTestMail()))}
          >
            {testing ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
            {labels.sendTest}
          </Button>
          {testState.ok && <span className="text-sm text-muted-foreground">{labels.testSent}</span>}
          {err(testState.error) && (
            <span className="text-sm text-destructive" role="alert">
              {err(testState.error)}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
