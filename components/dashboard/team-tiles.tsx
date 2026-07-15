import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export type TeamReport = {
  id: string;
  firstName: string;
  lastName: string;
  position: { title: string } | null;
};

export function TeamTiles({ reports }: { reports: TeamReport[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {reports.map((report) => (
        <Link key={report.id} href={`/employees/${report.id}`}>
          <Card className="transition-colors hover:bg-accent/50">
            <CardContent>
              <div className="font-medium">
                {report.firstName} {report.lastName}
              </div>
              <div className="text-sm text-muted-foreground">{report.position?.title ?? "—"}</div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
