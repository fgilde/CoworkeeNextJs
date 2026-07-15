import { db } from "@/lib/db";

// Best-effort in-app notifications. These NEVER throw — a failure here must
// never break or roll back the core action that triggered it. Call these
// AFTER the core mutation succeeds, never inside a `db.$transaction`.
export type NotifyOptions = {
  type: string; // e.g. "leave.decided"
  titleKey: string; // i18n key under the `notifications` namespace, translated in the UI
  body?: string; // pre-rendered detail string (names/dates), stored raw
  link?: string; // in-app path, e.g. "/absences"
};

export async function notifyUser(userId: string, opts: NotifyOptions): Promise<void> {
  try {
    await db.notification.create({
      data: {
        userId,
        type: opts.type,
        title: opts.titleKey,
        body: opts.body ?? null,
        link: opts.link ?? null,
      },
    });
  } catch (e) {
    console.error("notifyUser failed", e);
  }
}

export async function notifyEmployee(employeeId: string, opts: NotifyOptions): Promise<void> {
  try {
    const user = await db.user.findUnique({ where: { employeeId }, select: { id: true } });
    if (user) await notifyUser(user.id, opts);
  } catch (e) {
    console.error("notifyEmployee failed", e);
  }
}

export async function notifyManyUsers(userIds: string[], opts: NotifyOptions): Promise<void> {
  await Promise.all(userIds.map((id) => notifyUser(id, opts)));
}
