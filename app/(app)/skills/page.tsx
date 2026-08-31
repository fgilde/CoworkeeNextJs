import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireAuth, can } from "@/lib/rbac";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { NewSkillForm, DeleteSkillButton, SkillRater, TeamRatingForm } from "@/components/skills/skill-forms";

export default async function SkillsPage() {
  const session = await requireAuth();
  const t = await getTranslations("skills");
  const canManage = can(session.user.role, "skill:manage");
  const isHrOrAdmin = session.user.role === "HR" || session.user.role === "ADMIN";

  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { employeeId: true } });
  const employeeId = user?.employeeId ?? null;

  const skills = await db.skill.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] });
  const header = <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>;

  // My own self-assessment.
  const myLevels = new Map<string, number>();
  if (employeeId) {
    const mine = await db.employeeSkill.findMany({ where: { employeeId }, select: { skillId: true, level: true } });
    for (const s of mine) myLevels.set(s.skillId, s.level);
  }

  const mySection = employeeId && (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold tracking-tight">{t("mySkills")}</h2>
      {skills.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noSkills")}</p>
      ) : (
        <Card>
          <CardContent className="flex flex-col divide-y">
            {skills.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
                <span className="text-sm">
                  {s.name}
                  {s.category && <span className="text-muted-foreground"> · {s.category}</span>}
                </span>
                <SkillRater employeeId={employeeId} skillId={s.id} level={myLevels.get(s.id) ?? 0} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </section>
  );

  if (!canManage) {
    return (
      <div className="flex flex-col gap-8">
        {header}
        {mySection}
      </div>
    );
  }

  // Team matrix (read-only) + a form to set individual ratings.
  const managerEmployeeId = session.user.role === "MANAGER" ? (employeeId ?? "__none__") : undefined;
  const teamEmployees = await db.employee.findMany({
    where: managerEmployeeId ? { managerId: managerEmployeeId } : undefined,
    select: { id: true, firstName: true, lastName: true, skills: { select: { skillId: true, level: true } } },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
  const employeeOptions = teamEmployees.map((e) => ({ id: e.id, name: `${e.firstName} ${e.lastName}` }));
  const skillOptions = skills.map((s) => ({ id: s.id, name: s.name }));
  const levelOf = (emp: (typeof teamEmployees)[number], skillId: string) =>
    emp.skills.find((s) => s.skillId === skillId)?.level ?? 0;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {header}
        {isHrOrAdmin && (
          <Link href="/skills/succession" className={buttonVariants({ variant: "outline", size: "sm" })}>
            {t("succession")}
          </Link>
        )}
      </div>

      {mySection}

      {isHrOrAdmin && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold tracking-tight">{t("manageSkills")}</h2>
          <NewSkillForm />
          {skills.length > 0 && (
            <Card>
              <CardContent className="flex flex-col divide-y">
                {skills.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
                    <span className="text-sm">
                      {s.name}
                      {s.category && <span className="text-muted-foreground"> · {s.category}</span>}
                    </span>
                    <DeleteSkillButton id={s.id} />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight">{t("teamMatrix")}</h2>
        <TeamRatingForm employees={employeeOptions} skills={skillOptions} />
        {teamEmployees.length === 0 || skills.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noMatrixData")}</p>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs tracking-wide text-muted-foreground uppercase">
                      <th className="px-4 py-2 font-medium">{t("employee")}</th>
                      {skills.map((s) => (
                        <th key={s.id} className="px-3 py-2 text-center font-medium">{s.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {teamEmployees.map((emp) => (
                      <tr key={emp.id} className="border-b last:border-0">
                        <td className="px-4 py-2 whitespace-nowrap">{emp.firstName} {emp.lastName}</td>
                        {skills.map((s) => {
                          const lvl = levelOf(emp, s.id);
                          return (
                            <td key={s.id} className="px-3 py-2 text-center">
                              {lvl > 0 ? <span className="font-medium">{lvl}</span> : <span className="text-muted-foreground">—</span>}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
