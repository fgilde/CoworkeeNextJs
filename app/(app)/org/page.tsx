import { getTranslations } from "next-intl/server";
import { requireAuth } from "@/lib/rbac";
import { db } from "@/lib/db";
import { buildTree, type OrgInput } from "@/lib/org-tree";
import { OrgTree } from "@/components/org/org-tree";

export default async function OrgPage() {
  await requireAuth();
  const t = await getTranslations("orgChart");

  const employees = await db.employee.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      managerId: true,
      position: { select: { title: true } },
    },
  });

  const mapped: OrgInput[] = employees.map((e) => ({
    id: e.id,
    managerId: e.managerId,
    firstName: e.firstName,
    lastName: e.lastName,
    positionTitle: e.position?.title,
  }));

  const forest = buildTree(mapped);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <OrgTree forest={forest} />
    </div>
  );
}
