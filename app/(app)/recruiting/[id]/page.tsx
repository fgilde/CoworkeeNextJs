import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/db";
import { PostingHeader } from "@/components/recruiting/posting-form";
import { Pipeline } from "@/components/recruiting/pipeline";
import { NewApplicationForm } from "@/components/recruiting/application-form";

export default async function PostingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireRole("HR", "ADMIN");
  const t = await getTranslations("recruiting");

  const [posting, departments, locations] = await Promise.all([
    db.jobPosting.findUnique({
      where: { id },
      include: {
        department: { select: { name: true } },
        location: { select: { name: true } },
        applications: { orderBy: { appliedAt: "asc" } },
      },
    }),
    db.department.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.location.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  if (!posting) notFound();

  return (
    <div className="flex flex-col gap-6">
      <PostingHeader
        posting={{
          id: posting.id,
          title: posting.title,
          description: posting.description,
          employmentType: posting.employmentType,
          departmentId: posting.departmentId,
          locationId: posting.locationId,
          status: posting.status,
        }}
        department={posting.department?.name ?? null}
        location={posting.location?.name ?? null}
        departments={departments}
        locations={locations}
      />

      <p className="whitespace-pre-line text-sm text-foreground/90">{posting.description}</p>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold tracking-tight">{t("pipeline")}</h2>
          <NewApplicationForm jobPostingId={posting.id} />
        </div>
        {posting.applications.length === 0 && <p className="text-sm text-muted-foreground">{t("noApplications")}</p>}
        <Pipeline
          applications={posting.applications.map((a) => ({
            id: a.id,
            firstName: a.firstName,
            lastName: a.lastName,
            email: a.email,
            phone: a.phone,
            rating: a.rating,
            notes: a.notes,
            stage: a.stage,
          }))}
        />
      </div>
    </div>
  );
}
