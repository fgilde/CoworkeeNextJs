"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { OrgNode } from "@/lib/org-tree";

function initials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function OrgNodeItem({
  node,
  noPositionLabel,
  expandLabel,
  collapseLabel,
}: {
  node: OrgNode;
  noPositionLabel: string;
  expandLabel: string;
  collapseLabel: string;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;

  return (
    <li>
      <div className="flex flex-col items-center gap-1">
        <Link
          href={`/employees/${node.id}`}
          className="flex min-w-44 items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-2.5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
        >
          <Avatar>
            <AvatarFallback className="bg-accent font-semibold text-accent-foreground">
              {initials(node.firstName, node.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="truncate text-sm leading-tight font-medium">
              {node.firstName} {node.lastName}
            </div>
            <div className="truncate text-xs text-muted-foreground">
              {node.positionTitle ?? noPositionLabel}
            </div>
          </div>
        </Link>
        {hasChildren && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-label={expanded ? collapseLabel : expandLabel}
            aria-expanded={expanded}
            className="flex size-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ChevronDown className={cn("size-3.5 transition-transform duration-200", !expanded && "-rotate-90")} />
          </button>
        )}
      </div>
      {hasChildren && expanded && (
        <ul>
          {node.children.map((child) => (
            <OrgNodeItem
              key={child.id}
              node={child}
              noPositionLabel={noPositionLabel}
              expandLabel={expandLabel}
              collapseLabel={collapseLabel}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function OrgTree({ forest }: { forest: OrgNode[] }) {
  const t = useTranslations("orgChart");

  if (forest.length === 0) {
    return <p className="text-muted-foreground">{t("empty")}</p>;
  }

  return (
    <div className="org-tree overflow-x-auto pb-4">
      <ul>
        {forest.map((root) => (
          <OrgNodeItem
            key={root.id}
            node={root}
            noPositionLabel={t("noPosition")}
            expandLabel={t("expand")}
            collapseLabel={t("collapse")}
          />
        ))}
      </ul>
    </div>
  );
}
