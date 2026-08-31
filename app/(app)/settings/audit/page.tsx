import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";

const LIMIT = 200;

export default async function AuditLogPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireRole("HR", "ADMIN");
  const { q } = await searchParams;
  const t = await getTranslations("audit");
  const locale = await getLocale();
  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "medium" });

  const query = q?.trim();
  const where = query
    ? {
        OR: [
          { action: { contains: query, mode: "insensitive" as const } },
          { entity: { contains: query, mode: "insensitive" as const } },
          { entityId: { contains: query, mode: "insensitive" as const } },
        ],
      }
    : undefined;

  const entries = await db.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, take: LIMIT });

  const actorIds = [...new Set(entries.map((e) => e.actorUserId))];
  const users = await db.user.findMany({ where: { id: { in: actorIds } }, select: { id: true, email: true } });
  const emailById = new Map(users.map((u) => [u.id, u.email]));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
        <Link href="/settings" className={buttonVariants({ variant: "outline", size: "sm" })}>
          {t("back")}
        </Link>
      </div>
      <p className="max-w-2xl text-sm text-muted-foreground">{t("intro")}</p>

      <form method="get" className="flex flex-wrap items-center gap-2">
        <Input name="q" defaultValue={query ?? ""} placeholder={t("searchPlaceholder")} className="w-64" />
        <button type="submit" className={buttonVariants({ variant: "outline", size: "sm" })}>
          {t("search")}
        </button>
        {query && (
          <Link href="/settings/audit" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            {t("clear")}
          </Link>
        )}
      </form>

      <Card>
        <CardContent className="p-0">
          {entries.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">{t("empty")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs tracking-wide text-muted-foreground uppercase">
                    <th className="px-4 py-2 font-medium">{t("when")}</th>
                    <th className="px-4 py-2 font-medium">{t("actor")}</th>
                    <th className="px-4 py-2 font-medium">{t("action")}</th>
                    <th className="px-4 py-2 font-medium">{t("entity")}</th>
                    <th className="px-4 py-2 font-medium">{t("changes")}</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e) => (
                    <tr key={e.id} className="border-b last:border-0 align-top">
                      <td className="px-4 py-2 whitespace-nowrap text-muted-foreground">
                        {dateFormatter.format(e.createdAt)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">{emailById.get(e.actorUserId) ?? t("systemActor")}</td>
                      <td className="px-4 py-2 whitespace-nowrap font-medium">{e.action}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-muted-foreground">
                        {e.entity}
                        <span className="block text-xs opacity-60">{e.entityId}</span>
                      </td>
                      <td className="px-4 py-2">
                        {e.changes != null ? (
                          <details>
                            <summary className="cursor-pointer text-muted-foreground">{t("view")}</summary>
                            <pre className="mt-1 max-w-md overflow-x-auto rounded bg-muted p-2 text-xs">
                              {JSON.stringify(e.changes, null, 2)}
                            </pre>
                          </details>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      {entries.length === LIMIT && <p className="text-xs text-muted-foreground">{t("limited", { limit: LIMIT })}</p>}
    </div>
  );
}
