import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/db";
import { EmployeeForm } from "@/components/employees/employee-form";

function toDateInputValue(date: Date | null): string | null {
  return date ? date.toISOString().slice(0, 10) : null;
}

export default async function EditEmployeePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireRole("HR", "ADMIN");
  const t = await getTranslations("employees");

  const [employee, departments, positions, locations, managers] = await Promise.all([
    db.employee.findUnique({ where: { id } }),
    db.department.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.position.findMany({ select: { id: true, title: true }, orderBy: { title: "asc" } }),
    db.location.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.employee.findMany({
      where: { id: { not: id } },
      select: { id: true, firstName: true, lastName: true },
      orderBy: { lastName: "asc" },
    }),
  ]);

  if (!employee) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{t("editEmployeeTitle")}</h1>
      <EmployeeForm
        mode="edit"
        id={employee.id}
        initial={{
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
          phone: employee.phone,
          birthDate: toDateInputValue(employee.birthDate),
          street: employee.street,
          city: employee.city,
          country: employee.country,
          hireDate: toDateInputValue(employee.hireDate)!,
          exitDate: toDateInputValue(employee.exitDate),
          contractType: employee.contractType,
          workload: employee.workload,
          status: employee.status,
          departmentId: employee.departmentId,
          positionId: employee.positionId,
          locationId: employee.locationId,
          managerId: employee.managerId,
        }}
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
