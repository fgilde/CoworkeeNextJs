"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { LayoutDashboard, Users, Network, Settings, CircleUser, CalendarDays, ClipboardCheck, CalendarRange, Clock, FileText, Megaphone, ListChecks, Target, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type NavKey =
  | "dashboard"
  | "employees"
  | "orgChart"
  | "absences"
  | "approvals"
  | "team"
  | "time"
  | "teamTime"
  | "documents"
  | "news"
  | "onboarding"
  | "performance"
  | "settings"
  | "account";

type NavItem = {
  href: string;
  labelKey: NavKey;
  icon: LucideIcon;
  group: "main" | "account";
};

const NAV_ITEMS: NavItem[] = [
  { href: "/", labelKey: "dashboard", icon: LayoutDashboard, group: "main" },
  { href: "/employees", labelKey: "employees", icon: Users, group: "main" },
  { href: "/org", labelKey: "orgChart", icon: Network, group: "main" },
  { href: "/absences", labelKey: "absences", icon: CalendarDays, group: "main" },
  { href: "/absences/approvals", labelKey: "approvals", icon: ClipboardCheck, group: "main" },
  { href: "/absences/team", labelKey: "team", icon: CalendarRange, group: "main" },
  { href: "/time", labelKey: "time", icon: Clock, group: "main" },
  { href: "/time/team", labelKey: "teamTime", icon: Clock, group: "main" },
  { href: "/documents", labelKey: "documents", icon: FileText, group: "main" },
  { href: "/news", labelKey: "news", icon: Megaphone, group: "main" },
  { href: "/onboarding", labelKey: "onboarding", icon: ListChecks, group: "main" },
  { href: "/performance", labelKey: "performance", icon: Target, group: "main" },
  { href: "/settings", labelKey: "settings", icon: Settings, group: "account" },
  { href: "/account", labelKey: "account", icon: CircleUser, group: "account" },
];

function NavLink({ href, labelKey, icon: Icon, active, label }: NavItem & { active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-1 left-0 w-0.5 rounded-full bg-primary transition-all duration-200",
          active ? "opacity-100" : "opacity-0"
        )}
      />
      <Icon className="size-4 shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );
}

export function AppSidebar({
  canSettings,
  canApprove,
  canViewTeamTime,
}: {
  canSettings: boolean;
  canApprove: boolean;
  canViewTeamTime: boolean;
}) {
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  const pathname = usePathname();

  const items = NAV_ITEMS.filter(
    (item) =>
      (item.labelKey !== "settings" || canSettings) &&
      (item.labelKey !== "approvals" || canApprove) &&
      (item.labelKey !== "team" || canApprove) &&
      (item.labelKey !== "teamTime" || canViewTeamTime)
  );
  const mainItems = items.filter((item) => item.group === "main");
  const accountItems = items.filter((item) => item.group === "account");

  // "/absences" and "/time" are prefixes of their own sub-routes (e.g. "/absences/approvals",
  // "/time/team") — match them exactly so both nav entries don't highlight at once.
  const isActive = (href: string) =>
    href === "/" || href === "/absences" || href === "/time" ? pathname === href : pathname.startsWith(href);

  return (
    <aside className="flex w-[260px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
          {tCommon("appName").charAt(0)}
        </div>
        <span className="text-lg font-semibold tracking-tight">{tCommon("appName")}</span>
      </div>
      <nav className="flex flex-col gap-1 px-3">
        {mainItems.map((item) => (
          <NavLink key={item.href} {...item} active={isActive(item.href)} label={t(item.labelKey)} />
        ))}
      </nav>
      {accountItems.length > 0 && (
        <nav className="mt-auto flex flex-col gap-1 border-t border-sidebar-border px-3 py-3">
          {accountItems.map((item) => (
            <NavLink key={item.href} {...item} active={isActive(item.href)} label={t(item.labelKey)} />
          ))}
        </nav>
      )}
    </aside>
  );
}
