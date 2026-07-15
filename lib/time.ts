export function entryHours(start: Date, end: Date, breakMinutes: number): number {
  const raw = (end.getTime() - start.getTime()) / 3_600_000 - breakMinutes / 60;
  return Math.round(Math.max(raw, 0) * 100) / 100;
}

export function sumHours(
  entries: { start: Date; end: Date | null; breakMinutes: number }[]
): number {
  const total = entries.reduce(
    (sum, e) => sum + (e.end ? entryHours(e.start, e.end, e.breakMinutes) : 0),
    0
  );
  return Math.round(total * 100) / 100;
}
