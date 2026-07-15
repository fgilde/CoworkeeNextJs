"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { markNotificationRead, markAllNotificationsRead } from "@/app/actions/notification-actions";
import { cn } from "@/lib/utils";

export type BellNotification = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: Date;
};

export function NotificationBell({
  notifications,
  unreadCount,
}: {
  notifications: BellNotification[];
  unreadCount: number;
}) {
  const t = useTranslations("notifications");
  const locale = useLocale();
  const router = useRouter();
  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });

  async function handleClick(n: BellNotification) {
    if (!n.read) await markNotificationRead(n.id);
    if (n.link) router.push(n.link);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" aria-label={t("title")} className="relative">
            <Bell className="size-4" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -right-1 -top-1 h-4 min-w-4 justify-center rounded-full px-1 text-[0.65rem]"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            )}
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-80 max-w-[90vw]">
        {notifications.length === 0 ? (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">{t("noNotifications")}</div>
        ) : (
          notifications.map((n) => (
            <DropdownMenuItem
              key={n.id}
              onClick={() => handleClick(n)}
              className={cn("flex flex-col items-start gap-0.5 whitespace-normal", !n.read && "bg-accent/60")}
            >
              <span className="flex w-full items-center gap-1.5 font-medium">
                {!n.read && <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-primary" />}
                {t(n.title.replace("notifications.", ""))}
              </span>
              {n.body && <span className="text-xs text-muted-foreground">{n.body}</span>}
              <span className="text-[0.7rem] text-muted-foreground/70">{dateFormatter.format(n.createdAt)}</span>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => markAllNotificationsRead()}>{t("markAllRead")}</DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/notifications")}>{t("viewAll")}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
