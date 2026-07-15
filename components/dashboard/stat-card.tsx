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
    <Card>
      <CardContent className="flex items-center gap-3">
        {Icon && (
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
            <Icon className="size-4 text-muted-foreground" />
          </div>
        )}
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="truncate text-base font-medium">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}
