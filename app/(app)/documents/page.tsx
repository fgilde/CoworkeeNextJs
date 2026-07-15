import { getTranslations, getLocale } from "next-intl/server";
import { requireAuth, can } from "@/lib/rbac";
import { db } from "@/lib/db";
import { formatFileSize } from "@/lib/documents";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UploadForm } from "@/components/documents/upload-form";
import { DeleteButton } from "@/components/documents/delete-button";

type SearchParams = { [key: string]: string | string[] | undefined };

function firstValue(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await requireAuth();
  const t = await getTranslations("documents");
  const locale = await getLocale();
  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });

  const canManage = can(session.user.role, "document:manage");

  if (!canManage) {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { employeeId: true },
    });

    if (!user?.employeeId) {
      return (
        <div className="flex flex-col gap-6">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("noEmployeeLinked")}</p>
        </div>
      );
    }

    const documents = await db.document.findMany({
      where: { employeeId: user.employeeId },
      orderBy: { uploadedAt: "desc" },
    });

    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
        {documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noDocuments")}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("fileName")}</TableHead>
                <TableHead>{t("category")}</TableHead>
                <TableHead>{t("size")}</TableHead>
                <TableHead>{t("uploadedAt")}</TableHead>
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
                    <Badge variant="outline">{t(`categories.${doc.category}`)}</Badge>
                  </TableCell>
                  <TableCell className="tabular-nums">{formatFileSize(doc.sizeBytes)}</TableCell>
                  <TableCell>{dateFormatter.format(doc.uploadedAt)}</TableCell>
                  <TableCell>
                    <a href={`/api/documents/${doc.id}`} className="text-sm font-medium text-primary hover:underline">
                      {t("download")}
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    );
  }

  // HR/ADMIN: all documents, optional employee filter, upload + delete.
  const sp = await searchParams;
  const rawFilter = firstValue(sp.employeeId);
  const employeeFilter = rawFilter && rawFilter !== "all" ? rawFilter : undefined;

  const [documents, employees] = await Promise.all([
    db.document.findMany({
      where: employeeFilter ? { employeeId: employeeFilter } : undefined,
      include: { employee: { select: { firstName: true, lastName: true } } },
      orderBy: { uploadedAt: "desc" },
    }),
    db.employee.findMany({
      select: { id: true, firstName: true, lastName: true },
      orderBy: { lastName: "asc" },
    }),
  ]);

  const employeeOptions = employees.map((e) => ({ id: e.id, name: `${e.firstName} ${e.lastName}` }));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>

      <UploadForm employees={employeeOptions} defaultEmployeeId={employeeFilter} />

      <form className="flex items-center gap-2" action="/documents">
        <select
          name="employeeId"
          defaultValue={employeeFilter ?? "all"}
          aria-label={t("filterEmployee")}
          className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm"
        >
          <option value="all">{t("allEmployees")}</option>
          {employeeOptions.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.name}
            </option>
          ))}
        </select>
        <button type="submit" className="text-sm font-medium text-primary hover:underline">
          {t("filterEmployee")}
        </button>
      </form>

      {documents.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noDocuments")}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("employee")}</TableHead>
              <TableHead>{t("fileName")}</TableHead>
              <TableHead>{t("category")}</TableHead>
              <TableHead>{t("size")}</TableHead>
              <TableHead>{t("uploadedAt")}</TableHead>
              <TableHead />
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell>
                  {doc.employee.firstName} {doc.employee.lastName}
                </TableCell>
                <TableCell>
                  <div className="font-medium">{doc.title}</div>
                  <div className="text-xs text-muted-foreground">{doc.originalName}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{t(`categories.${doc.category}`)}</Badge>
                </TableCell>
                <TableCell className="tabular-nums">{formatFileSize(doc.sizeBytes)}</TableCell>
                <TableCell>{dateFormatter.format(doc.uploadedAt)}</TableCell>
                <TableCell>
                  <a href={`/api/documents/${doc.id}`} className="text-sm font-medium text-primary hover:underline">
                    {t("download")}
                  </a>
                </TableCell>
                <TableCell>
                  <DeleteButton id={doc.id} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
