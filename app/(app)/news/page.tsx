import { getTranslations, getLocale } from "next-intl/server";
import { requireAuth, can } from "@/lib/rbac";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NewAnnouncementButton, AnnouncementControls } from "@/components/news/announcement-form";

export default async function NewsPage() {
  const session = await requireAuth();
  const t = await getTranslations("news");
  const locale = await getLocale();
  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: "long" });

  const canManage = can(session.user.role, "announcement:manage");

  const announcements = await db.announcement.findMany({
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }, { id: "desc" }],
  });

  const authorIds = [...new Set(announcements.map((a) => a.authorId))];
  const authors = authorIds.length
    ? await db.user.findMany({
        where: { id: { in: authorIds } },
        select: { id: true, email: true, employee: { select: { firstName: true, lastName: true } } },
      })
    : [];
  const authorNames = new Map(
    authors.map((a) => [a.id, a.employee ? `${a.employee.firstName} ${a.employee.lastName}` : a.email])
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
        {canManage && <NewAnnouncementButton />}
      </div>

      {announcements.length === 0 ? (
        <Card>
          <CardContent className="text-sm text-muted-foreground">{t("noAnnouncements")}</CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {announcements.map((announcement) => (
            <Card
              key={announcement.id}
              className={announcement.pinned ? "border-primary/40" : undefined}
            >
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold tracking-tight">{announcement.title}</h2>
                    {announcement.pinned && <Badge>{t("pinned")}</Badge>}
                  </div>
                </div>
                <p className="whitespace-pre-line text-sm text-foreground/90">{announcement.body}</p>
                <div className="flex items-center justify-between gap-4 text-xs text-muted-foreground">
                  <span>
                    {t("author")}: {authorNames.get(announcement.authorId) ?? "—"} ·{" "}
                    {dateFormatter.format(announcement.createdAt)}
                  </span>
                  {canManage && (
                    <AnnouncementControls
                      announcement={{
                        id: announcement.id,
                        title: announcement.title,
                        body: announcement.body,
                        pinned: announcement.pinned,
                      }}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
