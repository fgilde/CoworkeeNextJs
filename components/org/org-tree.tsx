import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";
import type { OrgNode } from "@/lib/org-tree";

async function OrgNodeItem({ node, noPositionLabel }: { node: OrgNode; noPositionLabel: string }) {
  return (
    <li>
      <Link href={`/employees/${node.id}`} className="block">
        <Card size="sm" className="inline-block transition-colors hover:bg-accent/50">
          <CardContent className="flex flex-col">
            <span className="font-medium">
              {node.firstName} {node.lastName}
            </span>
            <span className="text-sm text-muted-foreground">
              {node.positionTitle ?? noPositionLabel}
            </span>
          </CardContent>
        </Card>
      </Link>
      {node.children.length > 0 && (
        <ul className="mt-3 flex flex-col gap-3 border-l pl-6">
          {node.children.map((child) => (
            <OrgNodeItem key={child.id} node={child} noPositionLabel={noPositionLabel} />
          ))}
        </ul>
      )}
    </li>
  );
}

export async function OrgTree({ forest }: { forest: OrgNode[] }) {
  const t = await getTranslations("orgChart");

  if (forest.length === 0) {
    return <p className="text-muted-foreground">{t("empty")}</p>;
  }

  return (
    <ul className="flex flex-col gap-6">
      {forest.map((root) => (
        <OrgNodeItem key={root.id} node={root} noPositionLabel={t("noPosition")} />
      ))}
    </ul>
  );
}
