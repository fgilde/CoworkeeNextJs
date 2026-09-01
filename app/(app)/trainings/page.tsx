import { getTranslations, getLocale } from "next-intl/server";
import { requireAuth, can } from "@/lib/rbac";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  NewCourseForm,
  DeleteCourseButton,
  AssignCourseForm,
  OwnTrainingStatus,
  UnassignButton,
} from "@/components/trainings/training-forms";

const STATUS_STYLES: Record<string, string | undefined> = {
  IN_PROGRESS: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  COMPLETED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
};

export default async function TrainingsPage() {
  const session = await requireAuth();
  const t = await getTranslations("trainings");
  const locale = await getLocale();
  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { employeeId: true },
  });
  const employeeId = user?.employeeId ?? null;

  const header = <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>;
  const canManage = can(session.user.role, "training:manage");

  const myEnrollments = employeeId
    ? await db.trainingEnrollment.findMany({
        where: { employeeId },
        include: { course: true },
        orderBy: { assignedAt: "desc" },
      })
    : [];

  const myTrainings = (
    <section className="flex flex-col gap-3">
      <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t("myTrainings")}</h2>
      {!employeeId ? (
        <Card>
          <CardContent className="text-sm text-muted-foreground">{t("noEmployee")}</CardContent>
        </Card>
      ) : myEnrollments.length === 0 ? (
        <Card>
          <CardContent className="text-sm text-muted-foreground">{t("noTrainings")}</CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {myEnrollments.map((enrollment) => (
            <Card key={enrollment.id}>
              <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{enrollment.course.title}</span>
                    <Badge variant="secondary" className={STATUS_STYLES[enrollment.status]}>
                      {t(`status.${enrollment.status}`)}
                    </Badge>
                  </div>
                  {enrollment.course.provider && (
                    <p className="text-sm text-muted-foreground">{enrollment.course.provider}</p>
                  )}
                  {enrollment.course.url && (
                    <a
                      href={enrollment.course.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      {t("openCourse")}
                    </a>
                  )}
                  {enrollment.completedAt && (
                    <p className="text-xs text-muted-foreground">
                      {t("completedAt")}: {dateFormatter.format(enrollment.completedAt)}
                    </p>
                  )}
                </div>
                <OwnTrainingStatus enrollment={{ id: enrollment.id, status: enrollment.status }} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );

  if (!canManage) {
    return (
      <div className="flex flex-col gap-8">
        {header}
        {myTrainings}
      </div>
    );
  }

  // MANAGER/HR/ADMIN view — team scoped (MANAGER: own reports, HR/ADMIN: everyone).
  const managerEmployeeId = session.user.role === "MANAGER" ? (employeeId ?? "__none__") : undefined;

  const inScopeEmployees = await db.employee.findMany({
    where: managerEmployeeId ? { managerId: managerEmployeeId } : { status: "ACTIVE" },
    select: { id: true, firstName: true, lastName: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
  const scopeIds = inScopeEmployees.map((e) => e.id);
  const employeeOptions = inScopeEmployees.map((e) => ({ id: e.id, name: `${e.firstName} ${e.lastName}` }));

  const [courses, enrollments] = await Promise.all([
    db.course.findMany({ orderBy: { createdAt: "desc" } }),
    db.trainingEnrollment.findMany({
      where: { employeeId: { in: scopeIds } },
      include: {
        course: { select: { title: true } },
        employee: { select: { firstName: true, lastName: true } },
      },
      orderBy: { assignedAt: "desc" },
    }),
  ]);
  const courseOptions = courses.map((c) => ({ id: c.id, title: c.title }));

  return (
    <div className="flex flex-col gap-8">
      {header}

      {myTrainings}

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold tracking-tight">{t("catalog")}</h2>
        <NewCourseForm />
        {courses.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noCourses")}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {courses.map((course) => (
              <Card key={course.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{course.title}</span>
                      {course.provider && (
                        <span className="text-sm text-muted-foreground">· {course.provider}</span>
                      )}
                    </div>
                    {course.url && (
                      <a
                        href={course.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        {t("openCourse")}
                      </a>
                    )}
                  </div>
                  <DeleteCourseButton id={course.id} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold tracking-tight">{t("assignTitle")}</h2>
        <AssignCourseForm courses={courseOptions} employees={employeeOptions} />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold tracking-tight">{t("teamEnrollments")}</h2>
        {enrollments.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noEnrollments")}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {enrollments.map((enrollment) => (
              <Card key={enrollment.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">
                      {enrollment.employee.firstName} {enrollment.employee.lastName}
                    </span>
                    <span className="text-sm text-muted-foreground">· {enrollment.course.title}</span>
                    <Badge variant="secondary" className={STATUS_STYLES[enrollment.status]}>
                      {t(`status.${enrollment.status}`)}
                    </Badge>
                  </div>
                  <UnassignButton id={enrollment.id} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
