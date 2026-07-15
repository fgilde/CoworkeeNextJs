"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import { clockIn, clockOut } from "@/app/actions/time-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function formatElapsed(ms: number): string {
  const totalMinutes = Math.max(0, Math.floor(ms / 60_000));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}:${String(m).padStart(2, "0")}`;
}

export function ClockWidget({ openEntryStart }: { openEntryStart: string | null }) {
  const t = useTranslations("time");
  const locale = useLocale();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  // ponytail: null until mount so SSR/hydration render matches; avoids a Date.now() mismatch warning.
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    if (!openEntryStart) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [openEntryStart]);

  const startDate = openEntryStart ? new Date(openEntryStart) : null;
  const timeFormatter = new Intl.DateTimeFormat(locale, { timeStyle: "short" });

  const handleClick = () => {
    setError(null);
    startTransition(async () => {
      const result = startDate ? await clockOut() : await clockIn();
      if (result.error) setError(t(result.error));
    });
  };

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-3">
        <div>
          {startDate ? (
            <>
              <p className="font-medium">{t("clockedInSince", { time: timeFormatter.format(startDate) })}</p>
              {now !== null && (
                <p className="text-sm text-muted-foreground tabular-nums">
                  {formatElapsed(now - startDate.getTime())}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">{t("today")}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <Button onClick={handleClick} disabled={isPending} variant={startDate ? "outline" : "default"}>
            {startDate ? t("clockOut") : t("clockIn")}
          </Button>
          {error && (
            <span className="text-sm text-destructive" role="alert">
              {error}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
