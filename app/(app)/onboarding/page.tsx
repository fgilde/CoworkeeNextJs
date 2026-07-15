import { getTranslations } from "next-intl/server";
import { requireAuth, can } from "@/lib/rbac";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NewTemplateButton, TemplateCard } from "@/components/onboarding/template-manager";
import {
  StartChecklistForm,
  DeleteChecklistButton,
  TaskToggle,
  ChecklistProgressBadge,
  ChecklistTypeBadge,
  ChecklistLink,
} from "@/components/onboarding/checklist-controls";

export default async function OnboardingPage() {
  const session = await requireAuth();
  const t = await getTranslations("onboarding");
  const canManage = can(session.user.role, "onboarding:manage");

  if (!canManage) {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { employeeId: true },
    });

    const checklists = user?.employeeId
      ? await db.employeeChecklist.findMany({
          where: { employeeId: user.employeeId },
          include: { tasks: { orderBy: { sortOrder: "asc" } } },
          orderBy: { createdAt: "desc" },
        })
      : [];

    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("myOnboarding")}</h1>
        {!user?.employeeId ? (
          <Card>
            <CardContent className="text-sm text-muted-foreground">{t("noEmployeeLinked")}</CardContent>
          </Card>
        ) : checklists.length === 0 ? (
          <Card>
            <CardContent className="text-sm text-muted-foreground">{t("noProcesses")}</CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {checklists.map((checklist) => (
              <Card key={checklist.id}>
                <CardContent className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold tracking-tight">{checklist.title}</h2>
                      <ChecklistTypeBadge type={checklist.type} />
                      {checklist.completedAt && <Badge>{t("completed")}</Badge>}
                    </div>
                    <ChecklistProgressBadge tasks={checklist.tasks} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {checklist.tasks.map((task) => (
                      <TaskToggle key={task.id} task={task} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  const [templates, employees, checklists] = await Promise.all([
    db.checklistTemplate.findMany({
      include: { items: { orderBy: { sortOrder: "asc" } } },
      orderBy: { name: "asc" },
    }),
    db.employee.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, firstName: true, lastName: true },
      orderBy: { lastName: "asc" },
    }),
    db.employeeChecklist.findMany({
      include: {
        employee: { select: { firstName: true, lastName: true } },
        tasks: { orderBy: { sortOrder: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const employeeOptions = employees.map((e) => ({ id: e.id, name: `${e.firstName} ${e.lastName}` }));
  const templateOptions = templates.map((tpl) => ({ id: tpl.id, name: tpl.name }));

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold tracking-tight">{t("templates")}</h2>
          <NewTemplateButton />
        </div>
        {templates.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noTemplates")}</p>
        ) : (
          <div className="flex flex-col gap-4">
            {templates.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold tracking-tight">{t("startProcess")}</h2>
        <StartChecklistForm employees={employeeOptions} templates={templateOptions} />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold tracking-tight">{t("active")}</h2>
        {checklists.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noProcesses")}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {checklists.map((checklist) => (
              <Card key={checklist.id}>
                <CardContent className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <ChecklistLink id={checklist.id}>
                      {checklist.employee.firstName} {checklist.employee.lastName} · {checklist.title}
                    </ChecklistLink>
                    <ChecklistTypeBadge type={checklist.type} />
                    {checklist.completedAt && <Badge>{t("completed")}</Badge>}
                  </div>
                  <div className="flex items-center gap-3">
                    <ChecklistProgressBadge tasks={checklist.tasks} />
                    <DeleteChecklistButton id={checklist.id} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
