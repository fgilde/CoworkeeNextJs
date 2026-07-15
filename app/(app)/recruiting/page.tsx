import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { NewPostingForm, JobStatusBadge } from "@/components/recruiting/posting-form";

export default async function RecruitingPage() {
  await requireRole("HR", "ADMIN");
  const t = await getTranslations("recruiting");

  const [postings, departments, locations] = await Promise.all([
    db.jobPosting.findMany({
      include: {
        department: { select: { name: true } },
        location: { select: { name: true } },
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.department.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.location.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
        <NewPostingForm departments={departments} locations={locations} />
      </div>

      {postings.length === 0 ? (
        <Card>
          <CardContent className="text-sm text-muted-foreground">{t("noPostings")}</CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {postings.map((posting) => (
            <Link key={posting.id} href={`/recruiting/${posting.id}`} className="block">
              <Card className="transition-colors hover:bg-muted/50">
                <CardContent className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold">{posting.title}</h2>
                    <JobStatusBadge status={posting.status} />
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{[posting.department?.name, posting.location?.name].filter(Boolean).join(" · ") || "—"}</span>
                    <span>
                      {posting._count.applications} {t("applications")}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
