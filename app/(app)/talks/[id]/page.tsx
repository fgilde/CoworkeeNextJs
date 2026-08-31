import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { requireAuth } from "@/lib/rbac";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TalkAgenda,
  ReleaseTalkButton,
  CompleteTalkForm,
  DeleteTalkButton,
  TALK_STATUS_KEY,
  type AgendaAnswers,
} from "@/components/talks/talk-forms";

const STATUS_STYLES: Record<string, string | undefined> = {
  SHARED: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  COMPLETED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
};

export default async function TalkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireAuth();
  const t = await getTranslations("talks");
  const locale = await getLocale();
  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: "long" });

  const talk = await db.talk.findUnique({
    where: { id },
    include: {
      employee: { select: { id: true, firstName: true, lastName: true } },
      manager: { select: { id: true, firstName: true, lastName: true } },
      items: { orderBy: { order: "asc" } },
      answers: true,
    },
  });
  if (!talk) notFound();

  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { employeeId: true } });
  const actorEmployeeId = user?.employeeId ?? null;
  const isHrOrAdmin = session.user.role === "HR" || session.user.role === "ADMIN";
  const isManager = actorEmployeeId !== null && actorEmployeeId === talk.managerId;
  const isSubject = actorEmployeeId !== null && actorEmployeeId === talk.employeeId;
  const isManagerSide = isManager || isHrOrAdmin;

  // Same visibility rule as the server actions: only the two parties or HR/ADMIN,
  // and the subject never sees a DRAFT.
  if (!isManagerSide && !isSubject) notFound();
  if (isSubject && !isManagerSide && talk.status === "DRAFT") notFound();

  const mySide: "MANAGER" | "EMPLOYEE" | null = isManagerSide ? "MANAGER" : isSubject ? "EMPLOYEE" : null;
  const editable =
    talk.status !== "COMPLETED" && (isManagerSide || (isSubject && talk.status === "SHARED"));

  const answers: AgendaAnswers = {};
  for (const a of talk.answers) {
    (answers[a.itemId] ??= {})[a.party] = { text: a.text, rating: a.rating };
  }

  const managerLabel = `${talk.manager.firstName} ${talk.manager.lastName}`;
  const employeeLabel = `${talk.employee.firstName} ${talk.employee.lastName}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{talk.title}</h1>
          <Badge variant="secondary" className={STATUS_STYLES[talk.status]}>
            {t(TALK_STATUS_KEY[talk.status])}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {t("employee")}: {employeeLabel} · {t("withManager")}: {managerLabel}
          {talk.scheduledAt && ` · ${dateFormatter.format(talk.scheduledAt)}`}
        </p>
      </div>

      {isManagerSide && (
        <Card>
          <CardContent className="flex flex-col gap-4">
            {talk.status === "DRAFT" && (
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm text-muted-foreground">{t("draftHint")}</p>
                <ReleaseTalkButton id={talk.id} />
              </div>
            )}
            {talk.status === "SHARED" && (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-muted-foreground">{t("sharedHint")}</p>
                <CompleteTalkForm id={talk.id} />
              </div>
            )}
            <div className="flex justify-end">
              <DeleteTalkButton id={talk.id} />
            </div>
          </CardContent>
        </Card>
      )}

      {talk.status === "COMPLETED" && talk.summary && (
        <Card>
          <CardContent className="flex flex-col gap-1">
            <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t("summary")}</span>
            <p className="text-sm whitespace-pre-wrap">{talk.summary}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          {talk.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("emptyAgenda")}</p>
          ) : (
            <TalkAgenda
              talkId={talk.id}
              items={talk.items.map((it) => ({
                id: it.id,
                type: it.type,
                prompt: it.prompt,
                helpText: it.helpText,
                required: it.required,
              }))}
              answers={answers}
              mySide={mySide}
              editable={editable}
              managerLabel={managerLabel}
              employeeLabel={employeeLabel}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
