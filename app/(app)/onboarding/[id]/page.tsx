import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireAuth, can } from "@/lib/rbac";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TaskToggle, ChecklistProgressBadge, DeleteChecklistButton } from "@/components/onboarding/checklist-controls";

export default async function ChecklistDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireAuth();
  const t = await getTranslations("onboarding");

  const checklist = await db.employeeChecklist.findUnique({
    where: { id },
    include: {
      employee: { select: { firstName: true, lastName: true } },
      tasks: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!checklist) notFound();

  const canManage = can(session.user.role, "onboarding:manage");
  if (!canManage) {
    const user = await db.user.findUnique({ where: { id: session.user.id }, select: { employeeId: true } });
    if (!user?.employeeId || user.employeeId !== checklist.employeeId) notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{checklist.title}</h1>
          {checklist.completedAt && <Badge>{t("completed")}</Badge>}
        </div>
        {canManage && <DeleteChecklistButton id={checklist.id} />}
      </div>

      <p className="text-sm text-muted-foreground">
        {checklist.employee.firstName} {checklist.employee.lastName}
      </p>

      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-sm font-semibold text-muted-foreground">{t("tasks")}</h2>
            <ChecklistProgressBadge tasks={checklist.tasks} />
          </div>
          <div className="flex flex-col gap-2">
            {checklist.tasks.map((task) => (
              <TaskToggle key={task.id} task={task} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
