import { getTranslations, getLocale } from "next-intl/server";
import { requireAuth, can } from "@/lib/rbac";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  SubmitExpenseForm,
  DecideExpenseButtons,
  MarkReimbursedButton,
  DeleteExpenseButton,
  EXPENSE_STATUS_KEY,
} from "@/components/expenses/expense-forms";

const STATUS_STYLES: Record<string, string | undefined> = {
  APPROVED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  REIMBURSED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  REJECTED: "bg-destructive/10 text-destructive",
};

function formatMoney(amountCents: number, currency: string, locale: string): string {
  return (amountCents / 100).toLocaleString(locale, { style: "currency", currency });
}

export default async function ExpensesPage() {
  const session = await requireAuth();
  const t = await getTranslations("expenses");
  const locale = await getLocale();
  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { employeeId: true },
  });

  const header = <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>;
  const canManage = can(session.user.role, "expense:manage");
  const isHrOrAdmin = session.user.role === "HR" || session.user.role === "ADMIN";

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
  const myExpenses = await db.expense.findMany({
    where: { employeeId },
    orderBy: { spentAt: "desc" },
  });

  // Team scope for managers/HR/ADMIN. MANAGER sees own reports; HR/ADMIN see everyone.
  const scopeWhere =
    session.user.role === "MANAGER" ? { employee: { managerId: employeeId } } : {};
  const teamInclude = { employee: { select: { firstName: true, lastName: true } } } as const;

  const [teamPending, teamApproved] = canManage
    ? await Promise.all([
        db.expense.findMany({
          where: { ...scopeWhere, status: "PENDING" },
          include: teamInclude,
          orderBy: { spentAt: "desc" },
        }),
        db.expense.findMany({
          where: { ...scopeWhere, status: "APPROVED" },
          include: teamInclude,
          orderBy: { spentAt: "desc" },
        }),
      ])
    : [[], []];

  return (
    <div className="flex flex-col gap-8">
      {header}

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold tracking-tight">{t("myExpenses")}</h2>
        <SubmitExpenseForm />
        {myExpenses.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noExpenses")}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {myExpenses.map((expense) => (
              <Card key={expense.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{expense.title}</span>
                      <span className="text-sm font-medium tabular-nums">
                        {formatMoney(expense.amountCents, expense.currency, locale)}
                      </span>
                      <Badge variant="secondary" className={STATUS_STYLES[expense.status]}>
                        {t(EXPENSE_STATUS_KEY[expense.status])}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {dateFormatter.format(expense.spentAt)}
                      {expense.category ? ` · ${expense.category}` : ""}
                    </p>
                  </div>
                  {expense.status === "PENDING" && <DeleteExpenseButton id={expense.id} />}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {canManage && (
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold tracking-tight">{t("teamExpenses")}</h2>

          {teamPending.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noPending")}</p>
          ) : (
            <div className="flex flex-col gap-3">
              {teamPending.map((expense) => (
                <Card key={expense.id}>
                  <CardContent className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">
                          {expense.employee.firstName} {expense.employee.lastName}
                        </span>
                        <span className="text-sm text-muted-foreground">· {expense.title}</span>
                        <span className="text-sm font-medium tabular-nums">
                          {formatMoney(expense.amountCents, expense.currency, locale)}
                        </span>
                        <Badge variant="secondary" className={STATUS_STYLES[expense.status]}>
                          {t(EXPENSE_STATUS_KEY[expense.status])}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {dateFormatter.format(expense.spentAt)}
                        {expense.category ? ` · ${expense.category}` : ""}
                      </p>
                    </div>
                    <DecideExpenseButtons id={expense.id} />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {teamApproved.length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {t("approvedPending")}
              </h3>
              {teamApproved.map((expense) => (
                <Card key={expense.id}>
                  <CardContent className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">
                        {expense.employee.firstName} {expense.employee.lastName}
                      </span>
                      <span className="text-sm text-muted-foreground">· {expense.title}</span>
                      <span className="text-sm font-medium tabular-nums">
                        {formatMoney(expense.amountCents, expense.currency, locale)}
                      </span>
                      <Badge variant="secondary" className={STATUS_STYLES[expense.status]}>
                        {t(EXPENSE_STATUS_KEY[expense.status])}
                      </Badge>
                    </div>
                    {isHrOrAdmin && <MarkReimbursedButton id={expense.id} />}
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
