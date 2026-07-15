import { db } from "@/lib/db";

export async function logAudit(
  actorUserId: string,
  action: string,
  entity: string,
  entityId: string,
  changes?: unknown
) {
  await db.auditLog.create({
    data: { actorUserId, action, entity, entityId, changes: changes as any },
  });
}
