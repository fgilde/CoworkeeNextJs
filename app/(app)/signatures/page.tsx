import { getTranslations, getLocale } from "next-intl/server";
import { requireAuth, can } from "@/lib/rbac";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  NewSignatureRequestForm,
  SignForm,
  DeleteRequestButton,
} from "@/components/signatures/signature-forms";

const STATUS_STYLES: Record<string, string | undefined> = {
  SIGNED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  DECLINED: "bg-destructive/10 text-destructive",
  PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
};

function StatusBadge({ status, label }: { status: string; label: string }) {
  return (
    <Badge variant="secondary" className={STATUS_STYLES[status]}>
      {label}
    </Badge>
  );
}

export default async function SignaturesPage() {
  const session = await requireAuth();
  const t = await getTranslations("signatures");
  const locale = await getLocale();
  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { employeeId: true },
  });
  const employeeId = user?.employeeId ?? null;

  const header = <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>;
  const canManage = can(session.user.role, "signature:manage");

  if (!employeeId) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <Card>
          <CardContent className="text-sm text-muted-foreground">{t("noEmployee")}</CardContent>
        </Card>
      </div>
    );
  }

  const [toSign, mineHandled, sent, activeEmployees] = await Promise.all([
    db.signatureRequest.findMany({
      where: { signerId: employeeId, status: "PENDING" },
      include: { requester: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.signatureRequest.findMany({
      where: { signerId: employeeId, status: { in: ["SIGNED", "DECLINED"] } },
      include: { requester: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: "desc" },
    }),
    canManage
      ? db.signatureRequest.findMany({
          where: { requesterId: employeeId },
          include: { signer: { select: { firstName: true, lastName: true } } },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
    canManage
      ? db.employee.findMany({
          where: { status: "ACTIVE" },
          select: { id: true, firstName: true, lastName: true },
          orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        })
      : Promise.resolve([]),
  ]);

  const employeeOptions = activeEmployees.map((e) => ({ id: e.id, name: `${e.firstName} ${e.lastName}` }));

  return (
    <div className="flex flex-col gap-8">
      {header}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight">{t("toSign")}</h2>
        {toSign.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("nothingToSign")}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {toSign.map((request) => (
              <Card key={request.id}>
                <CardContent className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{request.title}</span>
                    <p className="text-xs text-muted-foreground">
                      {t("requestedBy")}: {request.requester.firstName} {request.requester.lastName}
                    </p>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{request.body}</p>
                  <SignForm id={request.id} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight">{t("myHistory")}</h2>
        {mineHandled.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noHistory")}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {mineHandled.map((request) => (
              <Card key={request.id}>
                <CardContent className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{request.title}</span>
                    <StatusBadge status={request.status} label={t(`status.${request.status}`)} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("requestedBy")}: {request.requester.firstName} {request.requester.lastName}
                  </p>
                  {request.signedName && (
                    <p className="text-sm">
                      <span className="font-medium">{t("signedName")}:</span> {request.signedName}
                    </p>
                  )}
                  {request.signedAt && (
                    <p className="text-xs text-muted-foreground">
                      {t("signedAt")}: {dateFormatter.format(request.signedAt)}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {canManage && (
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold tracking-tight">{t("requestsISent")}</h2>
          <NewSignatureRequestForm employees={employeeOptions} />
          {sent.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noneSent")}</p>
          ) : (
            <div className="flex flex-col gap-3">
              {sent.map((request) => (
                <Card key={request.id}>
                  <CardContent className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{request.title}</span>
                        <span className="text-sm text-muted-foreground">
                          · {request.signer.firstName} {request.signer.lastName}
                        </span>
                        <StatusBadge status={request.status} label={t(`status.${request.status}`)} />
                      </div>
                      <DeleteRequestButton id={request.id} />
                    </div>
                    {request.signedName && (
                      <p className="text-sm">
                        <span className="font-medium">{t("signedName")}:</span> {request.signedName}
                      </p>
                    )}
                    {request.signedAt && (
                      <p className="text-xs text-muted-foreground">
                        {t("signedAt")}: {dateFormatter.format(request.signedAt)}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
