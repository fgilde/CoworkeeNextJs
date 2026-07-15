import { getTranslations, getLocale } from "next-intl/server";
import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DecisionControls } from "@/components/absences/decision-controls";

export default async function ApprovalsPage() {
  const session = await requireRole("MANAGER", "HR", "ADMIN");
  const t = await getTranslations("absences");
  const locale = await getLocale();
  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });

  let managerEmployeeId: string | undefined;
  if (session.user.role === "MANAGER") {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { employeeId: true },
    });
    // No linked employee → no reports, show nothing rather than leak all pending requests.
    managerEmployeeId = user?.employeeId ?? "__none__";
  }

  const requests = await db.leaveRequest.findMany({
    where: {
      status: "PENDING",
      ...(managerEmployeeId ? { employee: { managerId: managerEmployeeId } } : {}),
    },
    include: { employee: true, type: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("pendingApprovals")}</h1>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="text-sm text-muted-foreground">{t("noPendingApprovals")}</CardContent>
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("employee")}</TableHead>
              <TableHead>{t("type")}</TableHead>
              <TableHead>{t("from")}</TableHead>
              <TableHead>{t("to")}</TableHead>
              <TableHead>{t("workingDays")}</TableHead>
              <TableHead>{t("reason")}</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell>
                  {request.employee.firstName} {request.employee.lastName}
                </TableCell>
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
                <TableCell className="max-w-[220px] truncate text-muted-foreground">
                  {request.reason ?? "—"}
                </TableCell>
                <TableCell>
                  <DecisionControls id={request.id} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
