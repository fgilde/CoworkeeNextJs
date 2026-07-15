import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { getTranslations } from "next-intl/server";
import { requireAuth, can } from "@/lib/rbac";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { EmployeeFilters } from "@/components/employees/employee-filters";
import { EmployeeTable } from "@/components/employees/employee-table";

const PAGE_SIZE = 20;

type SearchParams = { [key: string]: string | string[] | undefined };

function firstValue(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await requireAuth();
  const t = await getTranslations("employees");
  const sp = await searchParams;

  const q = firstValue(sp.q);
  const department = firstValue(sp.department);
  const location = firstValue(sp.location);
  const status = firstValue(sp.status);
  const page = Math.max(1, Number(firstValue(sp.page)) || 1);

  const where: Prisma.EmployeeWhereInput = {
    ...(q && {
      OR: [
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ],
    }),
    ...(department && { departmentId: department }),
    ...(location && { locationId: location }),
    ...((status === "ACTIVE" || status === "INACTIVE") && { status }),
  };

  const [employees, total, departments, locations] = await Promise.all([
    db.employee.findMany({
      where,
      include: { department: true, position: true, location: true },
      orderBy: { lastName: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.employee.count({ where }),
    db.department.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.location.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const canWrite = can(session.user.role, "employee:write");

  const pageHref = (targetPage: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (department) params.set("department", department);
    if (location) params.set("location", location);
    if (status) params.set("status", status);
    if (targetPage > 1) params.set("page", String(targetPage));
    const qs = params.toString();
    return qs ? `/employees?${qs}` : "/employees";
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
        {canWrite && (
          <Link href="/employees/new" className={buttonVariants({ size: "sm" })}>
            {t("newEmployee")}
          </Link>
        )}
      </div>

      <EmployeeFilters departments={departments} locations={locations} />

      <EmployeeTable employees={employees} />

      <div className="flex items-center justify-between">
        <Link
          href={pageHref(page - 1)}
          aria-disabled={page <= 1}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            page <= 1 && "pointer-events-none opacity-50"
          )}
        >
          {t("previous")}
        </Link>
        <span className="text-sm tabular-nums text-muted-foreground">
          {t("pageOf", { page, total: totalPages })}
        </span>
        <Link
          href={pageHref(page + 1)}
          aria-disabled={page >= totalPages}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            page >= totalPages && "pointer-events-none opacity-50"
          )}
        >
          {t("next")}
        </Link>
      </div>
    </div>
  );
}
