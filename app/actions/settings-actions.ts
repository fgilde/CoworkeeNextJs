"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export type SettingsActionState = { error?: string };

function isDuplicateError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function isNotFoundError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025";
}

const departmentSchema = z.object({ name: z.string().trim().min(1) });
const positionSchema = z.object({ title: z.string().trim().min(1) });
const locationSchema = z.object({
  name: z.string().trim().min(1),
  city: z
    .string()
    .optional()
    .transform((v) => (v && v.trim().length > 0 ? v.trim() : null)),
  country: z
    .string()
    .optional()
    .transform((v) => (v && v.trim().length > 0 ? v.trim() : null)),
});

// A small shared shape so the create/update/delete logic below (auth check,
// zod parse, duplicate-name handling, referential-integrity guard, audit
// log, revalidate) is written once and reused for Department/Position/Location
// instead of three times.
type EntityDef<TData extends Record<string, unknown>> = {
  entity: string;
  actionPrefix: string;
  schema: z.ZodType<TData>;
  dbCreate: (data: TData) => Promise<{ id: string }>;
  dbUpdate: (id: string, data: TData) => Promise<unknown>;
  dbRemove: (client: Prisma.TransactionClient, id: string) => Promise<unknown>;
  countReferences: (client: Prisma.TransactionClient, id: string) => Promise<number>;
};

async function runCreate<TData extends Record<string, unknown>>(
  def: EntityDef<TData>,
  formData: FormData
): Promise<SettingsActionState> {
  const session = await requireRole("HR", "ADMIN");

  const parsed = def.schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: "validationError" };

  try {
    const created = await def.dbCreate(parsed.data);
    await logAudit(session.user.id, `${def.actionPrefix}.create`, def.entity, created.id, parsed.data);
  } catch (error) {
    if (isDuplicateError(error)) return { error: "nameTaken" };
    throw error;
  }

  revalidatePath("/settings");
  return {};
}

async function runUpdate<TData extends Record<string, unknown>>(
  def: EntityDef<TData>,
  id: string,
  formData: FormData
): Promise<SettingsActionState> {
  const session = await requireRole("HR", "ADMIN");

  const parsed = def.schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: "validationError" };

  try {
    await def.dbUpdate(id, parsed.data);
    await logAudit(session.user.id, `${def.actionPrefix}.update`, def.entity, id, parsed.data);
  } catch (error) {
    if (isDuplicateError(error)) return { error: "nameTaken" };
    if (isNotFoundError(error)) return { error: "notFound" };
    throw error;
  }

  revalidatePath("/settings");
  return {};
}

async function runRemove<TData extends Record<string, unknown>>(
  def: EntityDef<TData>,
  id: string
): Promise<SettingsActionState> {
  const session = await requireRole("HR", "ADMIN");

  // Guard referential integrity in one transaction so the count-then-delete
  // can't race a concurrent insert (TOCTOU). Never let Prisma throw a raw FK error.
  try {
    const result = await db.$transaction(async (tx) => {
      const refCount = await def.countReferences(tx, id);
      if (refCount > 0) return { error: "inUse" } as SettingsActionState;
      await def.dbRemove(tx, id);
      return null;
    });
    if (result) return result;
  } catch (error) {
    if (isNotFoundError(error)) return { error: "notFound" };
    throw error;
  }

  await logAudit(session.user.id, `${def.actionPrefix}.delete`, def.entity, id);

  revalidatePath("/settings");
  return {};
}

const departmentDef: EntityDef<z.infer<typeof departmentSchema>> = {
  entity: "Department",
  actionPrefix: "department",
  schema: departmentSchema,
  dbCreate: (data) => db.department.create({ data }),
  dbUpdate: (id, data) => db.department.update({ where: { id }, data }),
  dbRemove: (tx, id) => tx.department.delete({ where: { id } }),
  countReferences: (tx, id) => tx.employee.count({ where: { departmentId: id } }),
};

const positionDef: EntityDef<z.infer<typeof positionSchema>> = {
  entity: "Position",
  actionPrefix: "position",
  schema: positionSchema,
  dbCreate: (data) => db.position.create({ data }),
  dbUpdate: (id, data) => db.position.update({ where: { id }, data }),
  dbRemove: (tx, id) => tx.position.delete({ where: { id } }),
  countReferences: (tx, id) => tx.employee.count({ where: { positionId: id } }),
};

const locationDef: EntityDef<z.infer<typeof locationSchema>> = {
  entity: "Location",
  actionPrefix: "location",
  schema: locationSchema,
  dbCreate: (data) => db.location.create({ data }),
  dbUpdate: (id, data) => db.location.update({ where: { id }, data }),
  dbRemove: (tx, id) => tx.location.delete({ where: { id } }),
  countReferences: (tx, id) => tx.employee.count({ where: { locationId: id } }),
};

export async function createDepartment(
  _prevState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  return runCreate(departmentDef, formData);
}
export async function updateDepartment(
  id: string,
  _prevState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  return runUpdate(departmentDef, id, formData);
}
export async function deleteDepartment(id: string): Promise<SettingsActionState> {
  return runRemove(departmentDef, id);
}

export async function createPosition(
  _prevState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  return runCreate(positionDef, formData);
}
export async function updatePosition(
  id: string,
  _prevState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  return runUpdate(positionDef, id, formData);
}
export async function deletePosition(id: string): Promise<SettingsActionState> {
  return runRemove(positionDef, id);
}

export async function createLocation(
  _prevState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  return runCreate(locationDef, formData);
}
export async function updateLocation(
  id: string,
  _prevState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  return runUpdate(locationDef, id, formData);
}
export async function deleteLocation(id: string): Promise<SettingsActionState> {
  return runRemove(locationDef, id);
}
