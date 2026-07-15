import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { requireAuth, can } from "@/lib/rbac";
import { db } from "@/lib/db";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProfileTabs } from "@/components/employees/profile-tabs";

export default async function EmployeeProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireAuth();
  const t = await getTranslations("employees");
  const locale = await getLocale();

  const employee = await db.employee.findUnique({
    where: { id },
    include: {
      department: true,
      position: true,
      location: true,
      manager: { include: { position: true } },
      reports: { include: { position: true } },
    },
  });

  if (!employee) notFound();

  const currentUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: { employeeId: true },
  });
  const isOwnProfile = currentUser?.employeeId === employee.id;
  const canEdit = can(session.user.role, "employee:write") || isOwnProfile;

  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: "long" });

  const profile = {
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email,
    phone: employee.phone,
    birthDate: employee.birthDate ? dateFormatter.format(employee.birthDate) : null,
    street: employee.street,
    city: employee.city,
    country: employee.country,
    hireDate: dateFormatter.format(employee.hireDate),
    exitDate: employee.exitDate ? dateFormatter.format(employee.exitDate) : null,
    contractType: employee.contractType,
    workload: employee.workload,
    status: employee.status,
    department: employee.department ? { name: employee.department.name } : null,
    position: employee.position ? { title: employee.position.title } : null,
    location: employee.location ? { name: employee.location.name } : null,
    manager: employee.manager
      ? {
          id: employee.manager.id,
          firstName: employee.manager.firstName,
          lastName: employee.manager.lastName,
          position: employee.manager.position ? { title: employee.manager.position.title } : null,
        }
      : null,
    reports: employee.reports.map((report) => ({
      id: report.id,
      firstName: report.firstName,
      lastName: report.lastName,
      position: report.position ? { title: report.position.title } : null,
    })),
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {employee.firstName} {employee.lastName}
          </h1>
          <p className="text-sm text-muted-foreground">{employee.position?.title ?? "—"}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant="secondary"
            className={
              employee.status === "ACTIVE"
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                : undefined
            }
          >
            {employee.status === "ACTIVE" ? t("statusActive") : t("statusInactive")}
          </Badge>
          {canEdit && (
            <Link href={`/employees/${employee.id}/edit`} className={buttonVariants({ size: "sm" })}>
              {t("edit")}
            </Link>
          )}
        </div>
      </div>

      <ProfileTabs employee={profile} />
    </div>
  );
}
