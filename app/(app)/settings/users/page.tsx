import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/db";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserRoleRow, type RoleOption } from "@/components/settings/user-role-row";

const ROLES = ["ADMIN", "HR", "MANAGER", "EMPLOYEE"] as const;

export default async function SettingsUsersPage() {
  const session = await requireRole("ADMIN");
  const t = await getTranslations("settings");

  const users = await db.user.findMany({
    include: { employee: { select: { firstName: true, lastName: true } } },
    orderBy: { email: "asc" },
  });

  const roles: RoleOption[] = ROLES.map((value) => ({ value, label: t(`roles.${value}`) }));
  const errorMessages = {
    cannotChangeSelf: t("users.cannotChangeSelf"),
    invalidRole: t("users.invalidRole"),
  };
  const noEmployeeLinked = t("users.noEmployeeLinked");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{t("users.title")}</h1>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("users.email")}</TableHead>
            <TableHead>{t("users.employee")}</TableHead>
            <TableHead>{t("users.role")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <UserRoleRow
              key={user.id}
              userId={user.id}
              email={user.email}
              employeeName={
                user.employee ? `${user.employee.firstName} ${user.employee.lastName}` : noEmployeeLinked
              }
              role={user.role}
              roles={roles}
              isSelf={user.id === session.user.id}
              errorMessages={errorMessages}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
