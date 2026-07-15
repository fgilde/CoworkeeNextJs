import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { requireAuth } from "@/lib/rbac";
import { db } from "@/lib/db";
import { getLeaveBalance } from "@/lib/leave";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CancelLeaveRequestButton } from "@/components/absences/cancel-leave-request-button";

const STATUS_STYLES: Record<string, string | undefined> = {
  APPROVED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  REJECTED: "bg-destructive/10 text-destructive",
};

export default async function AbsencesPage() {
  const session = await requireAuth();
  const t = await getTranslations("absences");
  const locale = await getLocale();

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { employeeId: true },
  });

  const header = (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
      {user?.employeeId && (
        <Link href="/absences/new" className={buttonVariants({ size: "sm" })}>
          {t("request")}
        </Link>
      )}
    </div>
  );

  if (!user?.employeeId) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <Card>
          <CardContent className="text-sm text-muted-foreground">{t("noEmployee")}</CardContent>
        </Card>
      </div>
    );
  }

  const employeeId = user.employeeId;
  const year = new Date().getFullYear();
  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });

  const [leaveTypes, requests] = await Promise.all([
    db.leaveType.findMany({ orderBy: { name: "asc" } }),
    db.leaveRequest.findMany({
      where: { employeeId },
      include: { type: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const balances = await Promise.all(
    leaveTypes.map(async (type) => ({
      type,
      balance: await getLeaveBalance(employeeId, type.id, year),
    }))
  );

  return (
    <div className="flex flex-col gap-6">
      {header}

      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t("myBalance")}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {balances.map(({ type, balance }) => (
            <Card key={type.id}>
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: type.colorHex }}
                    aria-hidden
                  />
                  <span className="font-medium">{type.name}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm tabular-nums">
                  <div>
                    <div className="text-xs text-muted-foreground">{t("allocated")}</div>
                    <div>{balance.allocated}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">{t("used")}</div>
                    <div>{balance.used}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">{t("remaining")}</div>
                    <div className="font-medium">{balance.remaining}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t("myRequests")}</h2>
        {requests.length === 0 ? (
          <Card>
            <CardContent className="text-sm text-muted-foreground">{t("noRequests")}</CardContent>
          </Card>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("type")}</TableHead>
                <TableHead>{t("from")}</TableHead>
                <TableHead>{t("to")}</TableHead>
                <TableHead>{t("workingDays")}</TableHead>
                <TableHead>{t("statusColumn")}</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <span className="flex items-center gap-2">
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: request.type.colorHex }}
                        aria-hidden
                      />
                      {request.type.name}
                    </span>
                  </TableCell>
                  <TableCell>{dateFormatter.format(request.startDate)}</TableCell>
                  <TableCell>{dateFormatter.format(request.endDate)}</TableCell>
                  <TableCell className="tabular-nums">{request.workingDays}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={STATUS_STYLES[request.status]}>
                      {t(`status.${request.status}`)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {(request.status === "PENDING" || request.status === "APPROVED") && (
                      <CancelLeaveRequestButton id={request.id} />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
    </div>
  );
}
