import { getTranslations } from "next-intl/server";
import { requireAuth } from "@/lib/rbac";
import { db } from "@/lib/db";
import { LeaveRequestForm } from "@/components/absences/leave-request-form";

export default async function NewAbsencePage() {
  await requireAuth();
  const t = await getTranslations("absences");

  const types = await db.leaveType.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("newRequest")}</h1>
      <LeaveRequestForm types={types} />
    </div>
  );
}
