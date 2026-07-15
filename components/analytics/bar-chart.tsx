export type BarDatum = {
  key: string;
  label: string;
  value: number;
  /** Data-owned color (e.g. a leave type's own hex). Falls back to the app's --primary. */
  color?: string;
};

/**
 * Reusable magnitude bar chart — horizontal (default) or vertical columns.
 * Single-hue by default (uses --primary via a locally scoped CSS var so dark mode
 * inherits the app's already-stepped --primary value, never an auto-invert).
 * Rounded 4px data-end, 2px gap between bars, value label in ink color at the tip,
 * native `title` attribute for hover (dependency-free tooltip).
 */
export function BarChart({
  data,
  orientation = "horizontal",
  valueFormatter = (v: number) => String(v),
  emptyLabel,
}: {
  data: BarDatum[];
  orientation?: "horizontal" | "vertical";
  valueFormatter?: (value: number) => string;
  emptyLabel: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 0);
  if (data.length === 0 || max === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  if (orientation === "vertical") {
    return (
      <div
        role="img"
        aria-label={data.map((d) => `${d.label}: ${valueFormatter(d.value)}`).join(", ")}
        className="flex h-48 items-end gap-0.5 [--bar-color:var(--primary)]"
      >
        {data.map((d) => {
          const pct = Math.max((d.value / max) * 100, 2);
          return (
            <div
              key={d.key}
              className="flex h-full flex-1 flex-col items-center justify-end gap-1"
              title={`${d.label}: ${valueFormatter(d.value)}`}
            >
              <span className="text-xs font-medium tabular-nums text-foreground">{valueFormatter(d.value)}</span>
              <div className="w-full rounded-t-[4px] bg-(--bar-color)" style={{ height: `${pct}%` }} />
              <span className="max-w-full truncate text-xs text-muted-foreground">{d.label}</span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={data.map((d) => `${d.label}: ${valueFormatter(d.value)}`).join(", ")}
      className="flex flex-col gap-0.5 [--bar-color:var(--primary)]"
    >
      {data.map((d) => {
        const pct = Math.max((d.value / max) * 100, 2);
        return (
          <div key={d.key} className="flex items-center gap-2" title={`${d.label}: ${valueFormatter(d.value)}`}>
            <span className="w-28 shrink-0 truncate text-xs text-muted-foreground">{d.label}</span>
            <div className="h-5 flex-1">
              <div
                className="h-full rounded-r-[4px] bg-(--bar-color)"
                style={{ width: `${pct}%`, backgroundColor: d.color }}
              />
            </div>
            <span className="w-12 shrink-0 text-right text-xs font-medium tabular-nums text-foreground">
              {valueFormatter(d.value)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
