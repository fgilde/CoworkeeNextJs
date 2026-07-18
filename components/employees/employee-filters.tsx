"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Option = { id: string; name: string };

export function EmployeeFilters({
  departments,
  locations,
}: {
  departments: Option[];
  locations: Option[];
}) {
  const t = useTranslations("employees");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("q") ?? "");

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "all") params.set(key, value);
      else params.delete(key);
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  // Debounce the search input so typing doesn't push a URL update per keystroke.
  useEffect(() => {
    const current = searchParams.get("q") ?? "";
    if (search === current) return;
    const handle = setTimeout(() => updateParam("q", search), 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Input
        placeholder={t("searchPlaceholder")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-xs"
      />
      <Select
        value={searchParams.get("department") ?? "all"}
        items={{ all: t("allDepartments"), ...Object.fromEntries(departments.map((department) => [department.id, department.name])) }}
        onValueChange={(value) => updateParam("department", value as string)}
      >
        <SelectTrigger aria-label={t("filterDepartment")}>
          <SelectValue placeholder={t("allDepartments")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("allDepartments")}</SelectItem>
          {departments.map((department) => (
            <SelectItem key={department.id} value={department.id}>
              {department.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={searchParams.get("location") ?? "all"}
        items={{ all: t("allLocations"), ...Object.fromEntries(locations.map((location) => [location.id, location.name])) }}
        onValueChange={(value) => updateParam("location", value as string)}
      >
        <SelectTrigger aria-label={t("filterLocation")}>
          <SelectValue placeholder={t("allLocations")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("allLocations")}</SelectItem>
          {locations.map((location) => (
            <SelectItem key={location.id} value={location.id}>
              {location.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={searchParams.get("status") ?? "all"}
        items={{ all: t("allStatuses"), ACTIVE: t("statusActive"), INACTIVE: t("statusInactive") }}
        onValueChange={(value) => updateParam("status", value as string)}
      >
        <SelectTrigger aria-label={t("filterStatus")}>
          <SelectValue placeholder={t("allStatuses")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("allStatuses")}</SelectItem>
          <SelectItem value="ACTIVE">{t("statusActive")}</SelectItem>
          <SelectItem value="INACTIVE">{t("statusInactive")}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
