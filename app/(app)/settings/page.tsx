import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireRole, can } from "@/lib/rbac";
import { db } from "@/lib/db";
import { buttonVariants } from "@/components/ui/button";
import { CrudSection, type CrudField } from "@/components/settings/crud-section";
import { LeaveTypesSection } from "@/components/settings/leave-types-section";
import { EntitlementsSection } from "@/components/settings/entitlements-section";
import {
  createDepartment,
  updateDepartment,
  deleteDepartment,
  createPosition,
  updatePosition,
  deletePosition,
  createLocation,
  updateLocation,
  deleteLocation,
} from "@/app/actions/settings-actions";
import {
  createLeaveType,
  updateLeaveType,
  deleteLeaveType,
} from "@/app/actions/leave-settings-actions";

export default async function SettingsPage() {
  const session = await requireRole("HR", "ADMIN");
  const t = await getTranslations("settings");
  const tCommon = await getTranslations("common");
  const canManageLeave = can(session.user.role, "leave:manage");
  const currentYear = new Date().getFullYear();

  // Both roles that ever reach this page (RBAC gate above) already carry
  // leave:manage, so this data is fetched unconditionally; `canManageLeave`
  // still gates the rendered sections below for a clean, explicit guard.
  const [departments, positions, locations, leaveTypes, employees, entitlements] = await Promise.all([
    db.department.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.position.findMany({ select: { id: true, title: true }, orderBy: { title: "asc" } }),
    db.location.findMany({
      select: { id: true, name: true, city: true, country: true },
      orderBy: { name: "asc" },
    }),
    db.leaveType.findMany({
      select: { id: true, name: true, colorHex: true, paid: true, defaultDays: true },
      orderBy: { name: "asc" },
    }),
    db.employee.findMany({
      select: { id: true, firstName: true, lastName: true },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    }),
    db.leaveEntitlement.findMany({
      where: { year: currentYear },
      select: {
        id: true,
        days: true,
        employee: { select: { firstName: true, lastName: true } },
        type: { select: { name: true } },
      },
      orderBy: [{ employee: { firstName: "asc" } }, { type: { name: "asc" } }],
    }),
  ]);

  const employeeOptions = employees.map((e) => ({ id: e.id, name: `${e.firstName} ${e.lastName}` }));
  const entitlementRows = entitlements.map((e) => ({
    id: e.id,
    employeeName: `${e.employee.firstName} ${e.employee.lastName}`,
    typeName: e.type.name,
    days: e.days,
  }));

  const labels = {
    add: t("add"),
    save: tCommon("save"),
    cancel: tCommon("cancel"),
    edit: tCommon("edit"),
    delete: tCommon("delete"),
  };

  const errorMessages = {
    validationError: t("validationError"),
    nameTaken: t("nameTaken"),
    inUse: t("inUse"),
  };

  const nameField: CrudField[] = [{ name: "name", label: t("fieldName"), required: true }];
  const titleField: CrudField[] = [{ name: "title", label: t("fieldTitle"), required: true }];
  const locationFields: CrudField[] = [
    { name: "name", label: t("fieldName"), required: true },
    { name: "city", label: t("fieldCity") },
    { name: "country", label: t("fieldCountry") },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
        {can(session.user.role, "users:manage") && (
          <Link href="/settings/users" className={buttonVariants({ variant: "outline", size: "sm" })}>
            {t("manageUsers")}
          </Link>
        )}
      </div>

      <CrudSection
        title={t("departments")}
        fields={nameField}
        items={departments}
        createAction={createDepartment}
        updateAction={updateDepartment}
        deleteAction={deleteDepartment}
        labels={{ ...labels, empty: t("emptyDepartments") }}
        errorMessages={errorMessages}
      />

      <CrudSection
        title={t("positions")}
        fields={titleField}
        items={positions}
        createAction={createPosition}
        updateAction={updatePosition}
        deleteAction={deletePosition}
        labels={{ ...labels, empty: t("emptyPositions") }}
        errorMessages={errorMessages}
      />

      <CrudSection
        title={t("locations")}
        fields={locationFields}
        items={locations}
        createAction={createLocation}
        updateAction={updateLocation}
        deleteAction={deleteLocation}
        labels={{ ...labels, empty: t("emptyLocations") }}
        errorMessages={errorMessages}
      />

      {canManageLeave && (
        <>
          <LeaveTypesSection
            title={t("leaveTypes")}
            items={leaveTypes}
            createAction={createLeaveType}
            updateAction={updateLeaveType}
            deleteAction={deleteLeaveType}
            labels={{
              ...labels,
              empty: t("emptyLeaveTypes"),
              fieldName: t("fieldName"),
              fieldColor: t("fieldColor"),
              fieldPaid: t("fieldPaid"),
              fieldDefaultDays: t("fieldDefaultDays"),
            }}
            errorMessages={errorMessages}
          />

          <EntitlementsSection
            employees={employeeOptions}
            leaveTypes={leaveTypes}
            entitlements={entitlementRows}
            year={currentYear}
            labels={{
              title: t("entitlements"),
              employee: t("entitlementEmployee"),
              type: t("entitlementType"),
              year: t("entitlementYear"),
              days: t("entitlementDays"),
              submit: t("entitlementSubmit"),
              empty: t("emptyEntitlements"),
            }}
            errorMessages={errorMessages}
          />
        </>
      )}
    </div>
  );
}
