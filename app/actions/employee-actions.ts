"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/db";
import { employeeSchema } from "@/lib/employee-schema";

export type EmployeeFormState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

const RELATION_FIELDS = ["departmentId", "positionId", "locationId", "managerId"] as const;

function parseForm(formData: FormData) {
  const raw = Object.fromEntries(formData.entries()) as Record<string, string>;
  // The form uses a "none" sentinel value for unselected relation selects
  // (native <select>/base-ui Select can't carry an empty string value).
  for (const key of RELATION_FIELDS) {
    if (raw[key] === "none") raw[key] = "";
  }
  return employeeSchema.safeParse(raw);
}

function toEmployeeData(data: NonNullable<ReturnType<typeof employeeSchema.safeParse>["data"]>) {
  return {
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone ?? null,
    street: data.street ?? null,
    city: data.city ?? null,
    country: data.country ?? null,
    birthDate: data.birthDate ? new Date(data.birthDate) : null,
    hireDate: new Date(data.hireDate),
    exitDate: data.exitDate ? new Date(data.exitDate) : null,
    contractType: data.contractType,
    workload: data.workload,
    status: data.status,
    departmentId: data.departmentId ?? null,
    positionId: data.positionId ?? null,
    locationId: data.locationId ?? null,
    managerId: data.managerId ?? null,
  };
}

function isUniqueEmailError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function createEmployee(
  _prevState: EmployeeFormState,
  formData: FormData
): Promise<EmployeeFormState> {
  const session = await requireRole("HR", "ADMIN");

  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: "validationError", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = toEmployeeData(parsed.data);

  let employeeId: string;
  try {
    employeeId = await db.$transaction(async (tx) => {
      const emp = await tx.employee.create({ data });
      await tx.auditLog.create({
        data: {
          actorUserId: session.user.id,
          action: "employee.create",
          entity: "Employee",
          entityId: emp.id,
          changes: data as any,
        },
      });
      return emp.id;
    });
  } catch (error) {
    if (isUniqueEmailError(error)) return { error: "emailTaken" };
    throw error;
  }

  revalidatePath("/employees");
  redirect(`/employees/${employeeId}`);
}

export async function updateEmployee(
  id: string,
  _prevState: EmployeeFormState,
  formData: FormData
): Promise<EmployeeFormState> {
  const session = await requireRole("HR", "ADMIN");

  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: "validationError", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = toEmployeeData(parsed.data);

  if (data.managerId === id) {
    return { error: "managerSelf" };
  }

  try {
    await db.$transaction(async (tx) => {
      await tx.employee.update({ where: { id }, data });
      await tx.auditLog.create({
        data: {
          actorUserId: session.user.id,
          action: "employee.update",
          entity: "Employee",
          entityId: id,
          changes: data as any,
        },
      });
    });
  } catch (error) {
    if (isUniqueEmailError(error)) return { error: "emailTaken" };
    throw error;
  }

  revalidatePath("/employees");
  revalidatePath(`/employees/${id}`);
  redirect(`/employees/${id}`);
}
