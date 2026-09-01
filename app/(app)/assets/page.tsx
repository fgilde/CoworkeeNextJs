import { getTranslations, getLocale } from "next-intl/server";
import { requireAuth, can } from "@/lib/rbac";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CreateAssetForm,
  AssignAssetForm,
  ReturnAssetButton,
  RetireAssetButton,
  DeleteAssetButton,
} from "@/components/assets/asset-forms";

const ASSET_STATUS_STYLES: Record<string, string | undefined> = {
  ASSIGNED: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  RETIRED: "bg-muted text-muted-foreground",
};

export default async function AssetsPage() {
  const session = await requireAuth();
  const t = await getTranslations("assets");
  const locale = await getLocale();
  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { employeeId: true },
  });
  const employeeId = user?.employeeId ?? null;
  const canManage = can(session.user.role, "asset:manage");

  const header = <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>;

  const myAssets = employeeId
    ? await db.asset.findMany({ where: { assignedToId: employeeId }, orderBy: { assignedAt: "desc" } })
    : [];

  const allAssets = canManage
    ? await db.asset.findMany({
        include: { assignedTo: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: "desc" },
      })
    : [];
  const employees = canManage
    ? await db.employee.findMany({
        where: { status: "ACTIVE" },
        select: { id: true, firstName: true, lastName: true },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      })
    : [];
  const employeeOptions = employees.map((e) => ({ id: e.id, name: `${e.firstName} ${e.lastName}` }));

  return (
    <div className="flex flex-col gap-8">
      {header}

      {canManage && (
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold tracking-tight">{t("inventory")}</h2>
          <CreateAssetForm />
          {allAssets.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noAssets")}</p>
          ) : (
            <div className="flex flex-col gap-3">
              {allAssets.map((asset) => (
                <Card key={asset.id}>
                  <CardContent className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{asset.name}</span>
                        {asset.category && (
                          <span className="text-sm text-muted-foreground">· {asset.category}</span>
                        )}
                        <Badge variant="secondary" className={ASSET_STATUS_STYLES[asset.status]}>
                          {t(`status.${asset.status}`)}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {asset.status === "AVAILABLE" && (
                          <AssignAssetForm id={asset.id} employees={employeeOptions} />
                        )}
                        {asset.status === "ASSIGNED" && <ReturnAssetButton id={asset.id} />}
                        {asset.status !== "RETIRED" && <RetireAssetButton id={asset.id} />}
                        <DeleteAssetButton id={asset.id} />
                      </div>
                    </div>
                    {(asset.serialNumber || asset.assignedTo) && (
                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                        {asset.serialNumber && (
                          <span>
                            {t("serialNumber")}: {asset.serialNumber}
                          </span>
                        )}
                        {asset.assignedTo && (
                          <span>
                            {t("assignedTo")}: {asset.assignedTo.firstName} {asset.assignedTo.lastName}
                          </span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {t("myEquipment")}
        </h2>
        {!employeeId ? (
          <Card>
            <CardContent className="text-sm text-muted-foreground">{t("noEmployee")}</CardContent>
          </Card>
        ) : myAssets.length === 0 ? (
          <Card>
            <CardContent className="text-sm text-muted-foreground">{t("noEquipment")}</CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {myAssets.map((asset) => (
              <Card key={asset.id}>
                <CardContent className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{asset.name}</span>
                    {asset.category && (
                      <span className="text-sm text-muted-foreground">· {asset.category}</span>
                    )}
                  </div>
                  {asset.serialNumber && (
                    <p className="text-xs text-muted-foreground">
                      {t("serialNumber")}: {asset.serialNumber}
                    </p>
                  )}
                  {asset.assignedAt && (
                    <p className="text-xs text-muted-foreground">
                      {t("assignedAt")}: {dateFormatter.format(asset.assignedAt)}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
