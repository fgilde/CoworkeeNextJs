import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireAuth, can } from "@/lib/rbac";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { NewTemplateForm, DeleteTemplateButton } from "@/components/talks/template-forms";

export default async function TalkTemplatesPage() {
  const session = await requireAuth();
  if (!can(session.user.role, "talk:manage")) notFound();
  const t = await getTranslations("talks");

  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { employeeId: true } });
  const employeeId = user?.employeeId ?? null;
  const isHrOrAdmin = session.user.role === "HR" || session.user.role === "ADMIN";
  const canShare = isHrOrAdmin;

  // A manager sees their own templates plus any org-wide shared ones; HR/ADMIN see all.
  const templates = await db.talkTemplate.findMany({
    where: isHrOrAdmin ? undefined : { OR: [{ ownerId: employeeId ?? "__none__" }, { shared: true }] },
    include: {
      owner: { select: { id: true, firstName: true, lastName: true } },
      _count: { select: { items: true } },
    },
    orderBy: { title: "asc" },
  });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("templatesTitle")}</h1>
        <Link href="/talks" className={buttonVariants({ variant: "outline" })}>
          {t("backToTalks")}
        </Link>
      </div>
      <p className="max-w-2xl text-sm text-muted-foreground">{t("templatesIntro")}</p>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight">{t("newTemplate")}</h2>
        <NewTemplateForm canShare={canShare} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight">{t("yourTemplates")}</h2>
        {templates.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noTemplatesYet")}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {templates.map((tpl) => {
              const canEdit = isHrOrAdmin || tpl.ownerId === employeeId;
              return (
                <Card key={tpl.id}>
                  <CardContent className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {canEdit ? (
                          <Link
                            href={`/talks/templates/${tpl.id}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {tpl.title}
                          </Link>
                        ) : (
                          <span className="font-medium">{tpl.title}</span>
                        )}
                        {tpl.shared && <Badge variant="secondary">{t("shared")}</Badge>}
                        <span className="text-sm text-muted-foreground">
                          · {t("itemCount", { count: tpl._count.items })}
                        </span>
                      </div>
                      {tpl.description && <p className="text-sm text-muted-foreground">{tpl.description}</p>}
                      {!canEdit && (
                        <span className="text-xs text-muted-foreground">
                          {t("owner")}: {tpl.owner.firstName} {tpl.owner.lastName}
                        </span>
                      )}
                    </div>
                    {canEdit && (
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/talks/templates/${tpl.id}`}
                          className={buttonVariants({ variant: "outline", size: "sm" })}
                        >
                          {t("edit")}
                        </Link>
                        <DeleteTemplateButton id={tpl.id} />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
