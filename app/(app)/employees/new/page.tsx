import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/db";
import { EmployeeForm } from "@/components/employees/employee-form";

export default async function NewEmployeePage() {
  await requireRole("HR", "ADMIN");
  const t = await getTranslations("employees");

  const [departments, positions, locations, managers] = await Promise.all([
    db.department.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.position.findMany({ select: { id: true, title: true }, orderBy: { title: "asc" } }),
    db.location.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.employee.findMany({
      select: { id: true, firstName: true, lastName: true },
      orderBy: { lastName: "asc" },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("newEmployeeTitle")}</h1>
      <EmployeeForm
        mode="create"
        options={{
          departments: departments.map((d) => ({ id: d.id, label: d.name })),
          positions: positions.map((p) => ({ id: p.id, label: p.title })),
          locations: locations.map((l) => ({ id: l.id, label: l.name })),
          managers: managers.map((m) => ({ id: m.id, label: `${m.firstName} ${m.lastName}` })),
        }}
      />
    </div>
  );
}
