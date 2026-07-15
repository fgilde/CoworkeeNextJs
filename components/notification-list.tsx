"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { markNotificationRead, markAllNotificationsRead } from "@/app/actions/notification-actions";
import { cn } from "@/lib/utils";
import type { BellNotification } from "@/components/notification-bell";

export function NotificationList({
  notifications,
  locale,
}: {
  notifications: BellNotification[];
  locale: string;
}) {
  const t = useTranslations("notifications");
  const router = useRouter();
  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });
  const hasUnread = notifications.some((n) => !n.read);

  async function handleOpen(n: BellNotification) {
    if (!n.read) await markNotificationRead(n.id);
    if (n.link) router.push(n.link);
  }

  return (
    <div className="flex flex-col gap-4">
      {hasUnread && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => markAllNotificationsRead()}>
            {t("markAllRead")}
          </Button>
        </div>
      )}
      <div className="flex flex-col gap-2">
        {notifications.map((n) => (
          <Card key={n.id} className={cn(!n.read && "border-primary/40 bg-accent/40")}>
            <CardContent className="flex items-start justify-between gap-4">
              <button
                type="button"
                onClick={() => handleOpen(n)}
                className="flex flex-1 flex-col items-start gap-1 text-left"
              >
                <span className="flex items-center gap-1.5 font-medium">
                  {!n.read && <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-primary" />}
                  {t(n.title.replace("notifications.", ""))}
                </span>
                {n.body && <span className="text-sm text-muted-foreground">{n.body}</span>}
                <span className="text-xs text-muted-foreground/70">{dateFormatter.format(n.createdAt)}</span>
              </button>
              {!n.read && (
                <Button variant="ghost" size="sm" onClick={() => markNotificationRead(n.id)}>
                  {t("markRead")}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
