import type { StandardLevelAnalyticsRow } from "@/types/analytics";

function clamp01(value: number | undefined): number | undefined {
  if (value === undefined) return undefined;
  if (!Number.isFinite(value)) return undefined;
  return Math.max(0, Math.min(1, value));
}

function safeRate(numerator?: number, denominator?: number): number | undefined {
  if (numerator === undefined || denominator === undefined) return undefined;
  if (denominator <= 0) return undefined;
  const rate = numerator / denominator;
  if (!Number.isFinite(rate)) return undefined;
  return Math.max(0, Math.min(1, rate));
}

export function calculateAnalyticsMetrics(row: StandardLevelAnalyticsRow): {
  row: StandardLevelAnalyticsRow;
  warnings: string[];
} {
  const warnings: string[] = [];
  const next: StandardLevelAnalyticsRow = { ...row };

  if (next.passRate === undefined) {
    const computed = safeRate(next.completes, next.starts);
    if (computed !== undefined) next.passRate = computed;
  }
  if (next.failRate === undefined) {
    const computed = safeRate(next.fails, next.starts);
    if (computed !== undefined) next.failRate = computed;
  }
  if (next.quitRate === undefined) {
    const computed = safeRate(next.quits, next.starts);
    if (computed !== undefined) next.quitRate = computed;
  }
  if (next.retryRate === undefined) {
    const computed = safeRate(next.retries, next.starts);
    if (computed !== undefined) next.retryRate = computed;
  }

  next.passRate = clamp01(next.passRate);
  next.failRate = clamp01(next.failRate);
  next.quitRate = clamp01(next.quitRate);
  next.retryRate = clamp01(next.retryRate);

  const numericKeys: Array<keyof StandardLevelAnalyticsRow> = [
    "avgDurationSec",
    "avgRemainingTimeSec",
    "avgMoves",
    "avgBoostersUsed",
    "avgHintsUsed",
    "avgShuffleUsed",
    "revenue",
    "adImpressions",
    "iapPurchases",
  ];
  const mutable = next as Record<string, unknown>;
  for (const key of numericKeys) {
    const value = next[key];
    if (typeof value === "number" && !Number.isFinite(value)) {
      warnings.push(`字段 ${String(key)} 数值非法，已置空`);
      mutable[key as string] = undefined;
    }
  }

  if (next.starts !== undefined && next.starts === 0) {
    warnings.push("starts 为 0，未计算比率");
  }

  return { row: next, warnings };
}
