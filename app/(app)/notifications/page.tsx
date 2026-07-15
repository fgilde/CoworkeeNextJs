import { getTranslations, getLocale } from "next-intl/server";
import { requireAuth } from "@/lib/rbac";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { NotificationList } from "@/components/notification-list";

export default async function NotificationsPage() {
  const session = await requireAuth();
  const t = await getTranslations("notifications");
  const locale = await getLocale();

  const notifications = await db.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="text-sm text-muted-foreground">{t("noNotifications")}</CardContent>
        </Card>
      ) : (
        <NotificationList notifications={notifications} locale={locale} />
      )}
    </div>
  );
}
