import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <Card className="transition-all hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="flex items-center gap-3">
        {Icon && (
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent">
            <Icon className="size-4 text-accent-foreground" />
          </div>
        )}
        <div className="min-w-0">
          <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</div>
          <div className="truncate text-base font-medium tabular-nums">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}
