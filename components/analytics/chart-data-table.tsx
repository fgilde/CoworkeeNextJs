export function ChartDataTable({
  caption,
  categoryHeader,
  valueHeader,
  rows,
}: {
  caption: string;
  categoryHeader: string;
  valueHeader: string;
  rows: { label: string; value: string }[];
}) {
  return (
    <details className="mt-2 text-xs text-muted-foreground">
      <summary className="cursor-pointer select-none">{caption}</summary>
      <table className="mt-2 w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-border">
            <th className="py-1 pr-2 font-medium">{categoryHeader}</th>
            <th className="py-1 font-medium">{valueHeader}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-border/50 last:border-0">
              <td className="py-1 pr-2">{row.label}</td>
              <td className="py-1 tabular-nums">{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}
