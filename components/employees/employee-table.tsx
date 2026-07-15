import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type EmployeeRow = {
  id: string;
  firstName: string;
  lastName: string;
  status: "ACTIVE" | "INACTIVE";
  department: { name: string } | null;
  position: { title: string } | null;
  location: { name: string } | null;
};

export async function EmployeeTable({ employees }: { employees: EmployeeRow[] }) {
  const t = await getTranslations("employees");

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("columnName")}</TableHead>
          <TableHead>{t("columnPosition")}</TableHead>
          <TableHead>{t("columnDepartment")}</TableHead>
          <TableHead>{t("columnLocation")}</TableHead>
          <TableHead>{t("columnStatus")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {employees.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center text-muted-foreground">
              {t("noResults")}
            </TableCell>
          </TableRow>
        ) : (
          employees.map((employee) => (
            <TableRow key={employee.id} className="cursor-pointer">
              <TableCell className="font-medium">
                <Link href={`/employees/${employee.id}`} className="block">
                  {employee.firstName} {employee.lastName}
                </Link>
              </TableCell>
              <TableCell>
                <Link href={`/employees/${employee.id}`} className="block">
                  {employee.position?.title ?? "—"}
                </Link>
              </TableCell>
              <TableCell>
                <Link href={`/employees/${employee.id}`} className="block">
                  {employee.department?.name ?? "—"}
                </Link>
              </TableCell>
              <TableCell>
                <Link href={`/employees/${employee.id}`} className="block">
                  {employee.location?.name ?? "—"}
                </Link>
              </TableCell>
              <TableCell>
                <Link href={`/employees/${employee.id}`} className="block">
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
                </Link>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
