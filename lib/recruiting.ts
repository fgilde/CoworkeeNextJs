export const stageOrder = ["APPLIED", "SCREENING", "INTERVIEW", "OFFER", "HIRED", "REJECTED"] as const;

export function pipelineCounts(apps: { stage: string }[]): Record<string, number> {
  const counts = Object.fromEntries(stageOrder.map((stage) => [stage, 0])) as Record<string, number>;
  for (const app of apps) {
    if (app.stage in counts) counts[app.stage]++;
  }
  return counts;
}
