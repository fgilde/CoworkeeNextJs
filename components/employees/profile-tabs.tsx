"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TeamTiles } from "@/components/dashboard/team-tiles";

export type ProfileDocument = {
  id: string;
  title: string;
  category: "CONTRACT" | "PAYSLIP" | "CERTIFICATE" | "ID" | "OTHER";
  originalName: string;
  size: string;
  uploadedAt: string;
};

type PersonLink = {
  id: string;
  firstName: string;
  lastName: string;
  position: { title: string } | null;
};

export type EmployeeProfile = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  birthDate: string | null;
  street: string | null;
  city: string | null;
  country: string | null;
  hireDate: string;
  exitDate: string | null;
  contractType: "PERMANENT" | "TEMPORARY" | "INTERN" | "WORKING_STUDENT";
  workload: number;
  status: "ACTIVE" | "INACTIVE";
  department: { name: string } | null;
  position: { title: string } | null;
  location: { name: string } | null;
  manager: PersonLink | null;
  reports: PersonLink[];
};

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</span>
      <span className="text-sm">{value || "—"}</span>
    </div>
  );
}

export function ProfileTabs({
  employee,
  documents,
}: {
  employee: EmployeeProfile;
  documents: ProfileDocument[] | null;
}) {
  const t = useTranslations("employees");
  const td = useTranslations("documents");

  const address = [employee.street, employee.city, employee.country].filter(Boolean).join(", ");

  return (
    <Tabs defaultValue="person">
      <TabsList>
        <TabsTrigger value="person">{t("tabPerson")}</TabsTrigger>
        <TabsTrigger value="employment">{t("tabEmployment")}</TabsTrigger>
        <TabsTrigger value="team">{t("tabTeam")}</TabsTrigger>
        {documents && <TabsTrigger value="documents">{t("tabDocuments")}</TabsTrigger>}
      </TabsList>

      <TabsContent value="person">
        <Card>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label={t("firstName")} value={employee.firstName} />
            <Field label={t("lastName")} value={employee.lastName} />
            <Field label={t("email")} value={employee.email} />
            <Field label={t("phone")} value={employee.phone} />
            <Field label={t("birthDate")} value={employee.birthDate} />
            <Field label={t("address")} value={address} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="employment">
        <Card>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label={t("hireDate")} value={employee.hireDate} />
            <Field label={t("exitDate")} value={employee.exitDate} />
            <Field label={t("contractType")} value={t(`contractTypes.${employee.contractType}`)} />
            <Field label={t("workload")} value={`${employee.workload}%`} />
            <Field
              label={t("columnStatus")}
              value={employee.status === "ACTIVE" ? t("statusActive") : t("statusInactive")}
            />
            <Field label={t("columnDepartment")} value={employee.department?.name} />
            <Field label={t("columnPosition")} value={employee.position?.title} />
            <Field label={t("columnLocation")} value={employee.location?.name} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="team">
        <div className="flex flex-col gap-4">
          <Card>
            <CardContent className="flex flex-col gap-2">
              <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{t("manager")}</span>
              {employee.manager ? (
                <Link href={`/employees/${employee.manager.id}`} className="hover:underline">
                  <div className="text-sm font-medium">
                    {employee.manager.firstName} {employee.manager.lastName}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {employee.manager.position?.title ?? "—"}
                  </div>
                </Link>
              ) : (
                <span className="text-sm text-muted-foreground">{t("noManager")}</span>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{t("directReports")}</span>
            {employee.reports.length > 0 ? (
              <TeamTiles reports={employee.reports} />
            ) : (
              <Card>
                <CardContent className="text-sm text-muted-foreground">{t("noReports")}</CardContent>
              </Card>
            )}
          </div>
        </div>
      </TabsContent>

      {documents && (
        <TabsContent value="documents">
          {documents.length === 0 ? (
            <Card>
              <CardContent className="text-sm text-muted-foreground">{td("noDocuments")}</CardContent>
            </Card>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{td("fileName")}</TableHead>
                  <TableHead>{td("category")}</TableHead>
                  <TableHead>{td("size")}</TableHead>
                  <TableHead>{td("uploadedAt")}</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="font-medium">{doc.title}</div>
                      <div className="text-xs text-muted-foreground">{doc.originalName}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{td(`categories.${doc.category}`)}</Badge>
                    </TableCell>
                    <TableCell className="tabular-nums">{doc.size}</TableCell>
                    <TableCell>{doc.uploadedAt}</TableCell>
                    <TableCell>
                      <a
                        href={`/api/documents/${doc.id}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        {td("download")}
                      </a>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      )}
    </Tabs>
  );
}
