"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { LayoutDashboard, Users, Network, Settings, CircleUser, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type NavKey = "dashboard" | "employees" | "orgChart" | "settings" | "account";

type NavItem = {
  href: string;
  labelKey: NavKey;
  icon: LucideIcon;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/employees", labelKey: "employees", icon: Users },
  { href: "/org", labelKey: "orgChart", icon: Network },
  { href: "/settings", labelKey: "settings", icon: Settings },
  { href: "/account", labelKey: "account", icon: CircleUser },
];

export function AppSidebar({ canSettings }: { canSettings: boolean }) {
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  const pathname = usePathname();

  const items = NAV_ITEMS.filter((item) => item.labelKey !== "settings" || canSettings);

  return (
    <aside className="flex w-[260px] shrink-0 flex-col border-r border-border bg-sidebar text-sidebar-foreground">
      <div className="px-5 py-5 text-lg font-semibold tracking-tight">{tCommon("appName")}</div>
      <nav className="flex flex-col gap-1 px-3">
        {items.map(({ href, labelKey, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="size-4" />
              {t(labelKey)}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
