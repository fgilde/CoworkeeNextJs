export type DonutSlice = {
  key: string;
  label: string;
  value: number;
  /** One of --slot1..--slot4, assigned in a FIXED order by the caller — never re-ranked. */
  colorVar: "--slot1" | "--slot2" | "--slot3" | "--slot4";
};

// viewBox is deliberately larger than the ring itself (RADIUS) so direct labels
// placed outside the ring (LABEL_RADIUS) have room and never clip against the edge.
const SIZE = 320;
const RENDER_SIZE = 224;
const STROKE = 22;
const RADIUS = 95;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const GAP = 3; // px of arc left as a surface-gap between segments
const LABEL_RADIUS = RADIUS + STROKE / 2 + 20;
// The SVG is authored at SIZE but rendered at RENDER_SIZE, so font sizes are
// specified in user units scaled up by 1/SCALE to land at the intended on-screen px.
const SCALE = RENDER_SIZE / SIZE;
const px = (onScreenPx: number) => onScreenPx / SCALE;

/**
 * Categorical donut (4 fixed slots) — validated palette hues, assigned by identity
 * never by rank. Direct % labels + legend (secondary encoding, since the light slots
 * fall below 3:1 contrast on their own). Center shows the total. Native <title> per
 * segment for hover. CSS vars for the 4 slots are scoped to this component with
 * separate light/dark (stepped, not auto-inverted) values.
 */
export function DonutChart({
  data,
  totalLabel,
  emptyLabel,
}: {
  data: DonutSlice[];
  totalLabel: string;
  emptyLabel: string;
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  const visible = data.filter((d) => d.value > 0);
  const drawable = CIRCUMFERENCE - GAP * visible.length;

  let cursor = 0;
  const segments = visible.map((d) => {
    const len = (d.value / total) * drawable;
    const pct = Math.round((d.value / total) * 100);
    const midAngleDeg = -90 + ((cursor + len / 2) / CIRCUMFERENCE) * 360;
    const midAngleRad = (midAngleDeg * Math.PI) / 180;
    const labelX = SIZE / 2 + LABEL_RADIUS * Math.cos(midAngleRad);
    const labelY = SIZE / 2 + LABEL_RADIUS * Math.sin(midAngleRad);
    const cos = Math.cos(midAngleRad);
    const anchor: "start" | "end" | "middle" = cos > 0.35 ? "start" : cos < -0.35 ? "end" : "middle";
    const seg = { ...d, len, offset: cursor, pct, labelX, labelY, anchor };
    cursor += len + GAP;
    return seg;
  });

  return (
    <div className="[--slot1:#2a78d6] [--slot2:#008300] [--slot3:#e87ba4] [--slot4:#eda100] dark:[--slot1:#3987e5] dark:[--slot2:#008300] dark:[--slot3:#d55181] dark:[--slot4:#c98500]">
      <div className="flex flex-col items-center gap-4 sm:flex-row">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          width={RENDER_SIZE}
          height={RENDER_SIZE}
          className="shrink-0"
          role="img"
          aria-label={totalLabel}
        >
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="var(--muted)"
            strokeWidth={STROKE}
          />
          <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>
            {segments.map((s) => (
              <circle
                key={s.key}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke={`var(${s.colorVar})`}
                strokeWidth={STROKE}
                strokeDasharray={`${s.len} ${CIRCUMFERENCE - s.len}`}
                strokeDashoffset={-s.offset}
              >
                <title>{`${s.label}: ${s.value} (${s.pct}%)`}</title>
              </circle>
            ))}
          </g>
          {segments.map((s) => (
            <text
              key={`label-${s.key}`}
              x={s.labelX}
              y={s.labelY}
              textAnchor={s.anchor}
              dominantBaseline="middle"
              style={{ fontSize: px(12) }}
              className="fill-foreground font-medium tabular-nums"
            >
              {s.pct}%
            </text>
          ))}
          <text
            x={SIZE / 2}
            y={SIZE / 2 - 10}
            textAnchor="middle"
            dominantBaseline="middle"
            style={{ fontSize: px(26) }}
            className="fill-foreground font-semibold tabular-nums"
          >
            {total}
          </text>
          <text
            x={SIZE / 2}
            y={SIZE / 2 + 18}
            textAnchor="middle"
            dominantBaseline="middle"
            style={{ fontSize: px(11) }}
            className="fill-muted-foreground tracking-wide uppercase"
          >
            {totalLabel}
          </text>
        </svg>
        <ul className="flex flex-col gap-2">
          {data.map((d) => (
            <li key={d.key} className="flex items-center gap-2 text-sm">
              <span
                aria-hidden
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: `var(${d.colorVar})` }}
              />
              <span className="text-foreground">{d.label}</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {d.value} ({total > 0 ? Math.round((d.value / total) * 100) : 0}%)
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
