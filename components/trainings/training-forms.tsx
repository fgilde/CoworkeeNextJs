"use client";

import { useActionState, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createCourse,
  deleteCourse,
  assignCourse,
  updateOwnTrainingStatus,
  unassign,
  type TrainingActionState,
} from "@/app/actions/training-actions";

const initialState: TrainingActionState = {};

export type EmployeeOption = { id: string; name: string };
export type CourseOption = { id: string; title: string };

/** "New course" form shown to managers/HR/ADMIN. */
export function NewCourseForm() {
  const t = useTranslations("trainings");
  const [state, formAction, pending] = useActionState<TrainingActionState, FormData>(createCourse, initialState);

  return (
    <Card>
      <CardContent>
        <form action={formAction} className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-course-title">{t("courseTitle")}</Label>
            <Input id="new-course-title" name="title" required className="w-48" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-course-description">{t("description")}</Label>
            <Input id="new-course-description" name="description" className="w-56" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-course-provider">{t("provider")}</Label>
            <Input id="new-course-provider" name="provider" className="w-40" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-course-url">{t("url")}</Label>
            <Input id="new-course-url" name="url" type="url" className="w-56" />
          </div>
          <Button type="submit" disabled={pending}>
            {t("newCourse")}
          </Button>
          {state.error && (
            <p className="w-full text-sm text-destructive" role="alert">
              {t(state.error)}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

/** Delete control for a course, shown to managers/HR/ADMIN. */
export function DeleteCourseButton({ id }: { id: string }) {
  const t = useTranslations("trainings");
  const [isDeleting, startDeleteTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={isDeleting}
        onClick={() => {
          if (!window.confirm(t("confirmDeleteCourse"))) return;
          setError(null);
          startDeleteTransition(async () => {
            const result = await deleteCourse(id);
            if (result.error) setError(t(result.error));
          });
        }}
      >
        {t("delete")}
      </Button>
      {error && (
        <span className="text-sm text-destructive" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

/** "Assign course" form: pick a course and an in-scope employee. */
export function AssignCourseForm({
  courses,
  employees,
}: {
  courses: CourseOption[];
  employees: EmployeeOption[];
}) {
  const t = useTranslations("trainings");
  const [state, formAction, pending] = useActionState<TrainingActionState, FormData>(assignCourse, initialState);

  if (courses.length === 0 || employees.length === 0) return null;

  return (
    <Card>
      <CardContent>
        <form action={formAction} className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>{t("course")}</Label>
            <Select
              name="courseId"
              defaultValue={courses[0]?.id}
              items={Object.fromEntries(courses.map((course) => [course.id, course.title]))}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t("selectCourse")} />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t("employee")}</Label>
            <Select
              name="employeeId"
              defaultValue={employees[0]?.id}
              items={Object.fromEntries(employees.map((employee) => [employee.id, employee.name]))}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t("selectEmployee")} />
              </SelectTrigger>
              <SelectContent>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={pending}>
            {t("assign")}
          </Button>
          {state.error && (
            <p className="w-full text-sm text-destructive" role="alert">
              {t(state.error)}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

/** Self-service status control for an employee's own enrollment. */
export function OwnTrainingStatus({
  enrollment,
}: {
  enrollment: { id: string; status: "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" };
}) {
  const t = useTranslations("trainings");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = (status: "IN_PROGRESS" | "COMPLETED") => {
    setError(null);
    startTransition(async () => {
      const result = await updateOwnTrainingStatus(enrollment.id, status);
      if (result.error) setError(t(result.error));
    });
  };

  return (
    <div className="flex items-center gap-2">
      {enrollment.status !== "IN_PROGRESS" && enrollment.status !== "COMPLETED" && (
        <Button size="sm" variant="outline" disabled={isPending} onClick={() => run("IN_PROGRESS")}>
          {t("markInProgress")}
        </Button>
      )}
      {enrollment.status !== "COMPLETED" && (
        <Button size="sm" disabled={isPending} onClick={() => run("COMPLETED")}>
          {t("markCompleted")}
        </Button>
      )}
      {error && (
        <span className="text-sm text-destructive" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

/** Unassign control for a team enrollment, shown to managers/HR/ADMIN. */
export function UnassignButton({ id }: { id: string }) {
  const t = useTranslations("trainings");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={() => {
          if (!window.confirm(t("confirmUnassign"))) return;
          setError(null);
          startTransition(async () => {
            const result = await unassign(id);
            if (result.error) setError(t(result.error));
          });
        }}
      >
        {t("unassign")}
      </Button>
      {error && (
        <span className="text-sm text-destructive" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
