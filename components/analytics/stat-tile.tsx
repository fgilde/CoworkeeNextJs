import { Card, CardContent } from "@/components/ui/card";

export function StatTile({
  label,
  value,
  subNote,
}: {
  label: string;
  value: React.ReactNode;
  subNote?: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1">
        <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</span>
        <span className="text-3xl font-semibold tabular-nums text-foreground">{value}</span>
        {subNote && <span className="text-xs text-muted-foreground">{subNote}</span>}
      </CardContent>
    </Card>
  );
}
