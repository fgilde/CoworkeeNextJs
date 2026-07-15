import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireRole, can } from "@/lib/rbac";
import { db } from "@/lib/db";
import { buttonVariants } from "@/components/ui/button";
import { CrudSection, type CrudField } from "@/components/settings/crud-section";
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

export default async function SettingsPage() {
  const session = await requireRole("HR", "ADMIN");
  const t = await getTranslations("settings");
  const tCommon = await getTranslations("common");

  const [departments, positions, locations] = await Promise.all([
    db.department.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.position.findMany({ select: { id: true, title: true }, orderBy: { title: "asc" } }),
    db.location.findMany({
      select: { id: true, name: true, city: true, country: true },
      orderBy: { name: "asc" },
    }),
  ]);

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
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
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
    </div>
  );
}
