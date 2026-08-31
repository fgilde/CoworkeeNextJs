import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireAuth, can } from "@/lib/rbac";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { TemplateEditForm, AddItemForm, DeleteItemButton } from "@/components/talks/template-forms";

export default async function TalkTemplateBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireAuth();
  if (!can(session.user.role, "talk:manage")) notFound();
  const t = await getTranslations("talks");

  const template = await db.talkTemplate.findUnique({
    where: { id },
    include: { items: { orderBy: { order: "asc" } } },
  });
  if (!template) notFound();

  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { employeeId: true } });
  const employeeId = user?.employeeId ?? null;
  const isHrOrAdmin = session.user.role === "HR" || session.user.role === "ADMIN";
  if (!isHrOrAdmin && template.ownerId !== employeeId) notFound();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("editTemplate")}</h1>
        <Link href="/talks/templates" className={buttonVariants({ variant: "outline" })}>
          {t("backToTemplates")}
        </Link>
      </div>

      <Card>
        <CardContent>
          <TemplateEditForm
            template={{
              id: template.id,
              title: template.title,
              description: template.description,
              shared: template.shared,
            }}
            canShare={isHrOrAdmin}
          />
        </CardContent>
      </Card>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight">{t("agenda")}</h2>
        {template.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noItemsYet")}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {template.items.map((item) => (
              <Card key={item.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{t(`itemType.${item.type}`)}</Badge>
                      <span className={item.type === "SECTION" ? "font-semibold" : "font-medium"}>{item.prompt}</span>
                      {item.required && <span className="text-xs text-destructive">{t("required")}</span>}
                    </div>
                    {item.helpText && <span className="text-xs text-muted-foreground">{item.helpText}</span>}
                  </div>
                  <DeleteItemButton id={item.id} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight">{t("addItem")}</h2>
        <AddItemForm templateId={template.id} />
      </section>
    </div>
  );
}
