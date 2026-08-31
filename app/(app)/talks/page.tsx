import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { requireAuth, can } from "@/lib/rbac";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { NewTalkForm, TALK_STATUS_KEY } from "@/components/talks/talk-forms";

const STATUS_STYLES: Record<string, string | undefined> = {
  SHARED: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  COMPLETED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
};

type TalkRow = {
  id: string;
  title: string;
  status: string;
  scheduledAt: Date | null;
  employee: { firstName: string; lastName: string };
  manager: { firstName: string; lastName: string };
};

function TalkCard({
  talk,
  who,
  label,
  dateFormatter,
  statusText,
}: {
  talk: TalkRow;
  who: string;
  label: string;
  dateFormatter: Intl.DateTimeFormat;
  statusText: string;
}) {
  return (
    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <Link href={`/talks/${talk.id}`} className="font-medium text-primary hover:underline">
            {talk.title}
          </Link>
          <span className="text-sm text-muted-foreground">
            {label}: {who}
            {talk.scheduledAt && ` · ${dateFormatter.format(talk.scheduledAt)}`}
          </span>
        </div>
        <Badge variant="secondary" className={STATUS_STYLES[talk.status]}>
          {statusText}
        </Badge>
      </CardContent>
    </Card>
  );
}

export default async function TalksPage() {
  const session = await requireAuth();
  const t = await getTranslations("talks");
  const locale = await getLocale();
  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });

  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { employeeId: true } });
  const employeeId = user?.employeeId ?? null;
  const canManage = can(session.user.role, "talk:manage");
  const header = <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>;

  if (!employeeId && !canManage) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <Card>
          <CardContent className="text-sm text-muted-foreground">{t("noEmployee")}</CardContent>
        </Card>
      </div>
    );
  }

  // Everyone with an employee profile sees their own talks (as the subject),
  // once released — this is how a manager who also has a manager above them sees
  // their own conversation, configured by their supervisor.
  const myTalks = employeeId
    ? await db.talk.findMany({
        where: { employeeId, status: { not: "DRAFT" } },
        include: { employee: true, manager: true },
        orderBy: [{ scheduledAt: "desc" }, { createdAt: "desc" }],
      })
    : [];

  const mySection = employeeId && (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold tracking-tight">{t("myTalks")}</h2>
      {myTalks.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noMyTalks")}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {myTalks.map((talk) => (
            <TalkCard
              key={talk.id}
              talk={talk}
              label={t("withManager")}
              who={`${talk.manager.firstName} ${talk.manager.lastName}`}
              dateFormatter={dateFormatter}
              statusText={t(TALK_STATUS_KEY[talk.status])}
            />
          ))}
        </div>
      )}
    </section>
  );

  if (!canManage) {
    return (
      <div className="flex flex-col gap-8">
        {header}
        {mySection}
      </div>
    );
  }

  // Manager/HR/ADMIN: the talks they run, plus scheduling.
  const managerEmployeeId = session.user.role === "MANAGER" ? (employeeId ?? "__none__") : undefined;

  const inScopeEmployees = await db.employee.findMany({
    where: managerEmployeeId ? { managerId: managerEmployeeId } : undefined,
    select: { id: true, firstName: true, lastName: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
  const employeeOptions = inScopeEmployees.map((e) => ({ id: e.id, name: `${e.firstName} ${e.lastName}` }));

  const [teamTalks, templates] = await Promise.all([
    db.talk.findMany({
      where: managerEmployeeId ? { managerId: managerEmployeeId } : undefined,
      include: { employee: true, manager: true },
      orderBy: [{ scheduledAt: "desc" }, { createdAt: "desc" }],
    }),
    db.talkTemplate.findMany({
      where: employeeId
        ? session.user.role === "MANAGER"
          ? { OR: [{ ownerId: employeeId }, { shared: true }] }
          : undefined
        : { shared: true },
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {header}
        <Link href="/talks/templates" className={buttonVariants({ variant: "outline" })}>
          {t("manageTemplates")}
        </Link>
      </div>

      {mySection}

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold tracking-tight">{t("teamTalks")}</h2>
        <NewTalkForm employees={employeeOptions} templates={templates} />
        {teamTalks.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noTeamTalks")}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {teamTalks.map((talk) => (
              <TalkCard
                key={talk.id}
                talk={talk}
                label={t("employee")}
                who={`${talk.employee.firstName} ${talk.employee.lastName}`}
                dateFormatter={dateFormatter}
                statusText={t(TALK_STATUS_KEY[talk.status])}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
