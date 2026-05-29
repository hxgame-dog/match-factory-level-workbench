import type { DifficultyDiagnosisResult } from "@/types/difficulty";
import type { LevelConfig } from "@/types/level";
import type { SourceLevelPatternAnalysis } from "@/types/autoLevel";

function topCounts(values: string[]) {
  const map = new Map<string, number>();
  values.forEach((v) => map.set(v, (map.get(v) ?? 0) + 1));
  return [...map.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

export function analyzeSourceLevels(input: {
  levels: LevelConfig[];
  diagnoses: DifficultyDiagnosisResult[];
}): SourceLevelPatternAnalysis {
  const { levels, diagnoses } = input;
  const Ps = diagnoses.map((d) => d.score.P);
  const avgP = Ps.length ? Ps.reduce((a, b) => a + b, 0) / Ps.length : 0;
  const diffs = Ps.slice(1).map((p, i) => p - Ps[i]);
  const avgGrowth = diffs.length ? diffs.reduce((a, b) => a + b, 0) / diffs.length : 0;
  const volatility = diffs.length ? Math.sqrt(diffs.reduce((s, d) => s + (d - avgGrowth) ** 2, 0) / diffs.length) : 0;
  const trend =
    avgGrowth > 0.08 ? "rising" : avgGrowth < -0.08 ? "falling" : volatility > 0.2 ? "wave" : "stable";

  const structure = {
    avgTimeLimitSec: levels.reduce((s, l) => s + l.rules.timeLimitSec, 0) / Math.max(1, levels.length),
    avgSlotCount: levels.reduce((s, l) => s + l.rules.slotCount, 0) / Math.max(1, levels.length),
    avgBoardWidth: levels.reduce((s, l) => s + l.board.width, 0) / Math.max(1, levels.length),
    avgBoardHeight: levels.reduce((s, l) => s + l.board.height, 0) / Math.max(1, levels.length),
    avgLayerCount: levels.reduce((s, l) => s + l.board.layerCount, 0) / Math.max(1, levels.length),
    commonLayoutModes: topCounts(levels.map((l) => l.board.layoutMode)),
  };
  const allSpawns = levels.flatMap((l) => l.spawns);
  const items = {
    avgTargetTypeCount:
      levels.reduce((s, l) => s + new Set(l.targets.map((t) => t.name)).size, 0) / Math.max(1, levels.length),
    avgTargetTotalCount:
      levels.reduce((s, l) => s + l.targets.reduce((x, i) => x + i.count, 0), 0) / Math.max(1, levels.length),
    avgSpawnTypeCount:
      levels.reduce((s, l) => s + new Set(l.spawns.map((i) => i.name)).size, 0) / Math.max(1, levels.length),
    avgSpawnTotalCount:
      levels.reduce((s, l) => s + l.spawns.reduce((x, i) => x + i.count, 0), 0) / Math.max(1, levels.length),
    avgDistractorRatio:
      levels.reduce((s, l) => s + l.spawns.filter((i) => i.role === "distractor").reduce((x, i) => x + i.count, 0) / Math.max(1, l.spawns.reduce((x, i) => x + i.count, 0)), 0) /
      Math.max(1, levels.length),
    commonCategories: topCounts(allSpawns.map((i) => i.category1)),
    commonColors: topCounts(allSpawns.map((i) => i.color1 ?? "unknown")),
    commonShapes: topCounts(allSpawns.map((i) => i.shape ?? "unknown")),
    commonSizes: topCounts(allSpawns.map((i) => i.size ?? "unknown")),
  };
  const rules = {
    commonGeneratorRules: topCounts(levels.map((l) => l.rules.generatorRuleId)).map((x) => ({ id: x.value, count: x.count })),
    commonRefreshRules: topCounts(levels.map((l) => l.rules.refreshRuleId)).map((x) => ({ id: x.value, count: x.count })),
  };
  const missingAssetAvg =
    levels.reduce(
      (s, l) =>
        s +
        l.spawns.filter((item) => item.assetKey && !l.assets[item.assetKey]).length /
          Math.max(1, l.spawns.length),
      0,
    ) / Math.max(1, levels.length);
  const assetReuseRatio =
    new Set(allSpawns.map((i) => i.assetKey).filter(Boolean)).size / Math.max(1, allSpawns.length);

  const warnings: string[] = [];
  const suggestions: string[] = [];
  if (levels.length < 2) warnings.push("参考关卡少于 2 个，趋势可能不稳定");
  if (volatility > 0.35) warnings.push("参考关卡难度波动较大");
  if (missingAssetAvg > 0.2) warnings.push("平均资源缺失率较高");
  if (trend === "falling") suggestions.push("后续可使用 smooth_growth 稳定提升难度");
  if (items.avgDistractorRatio > 0.5) suggestions.push("建议降低干扰比例，避免视觉过载");

  return {
    count: levels.length,
    difficulty: {
      avgP,
      minP: Ps.length ? Math.min(...Ps) : 0,
      maxP: Ps.length ? Math.max(...Ps) : 0,
      trend: levels.length > 1 ? trend : "unknown",
      avgGrowth,
      volatility,
    },
    structure,
    items,
    rules,
    assets: {
      missingAssetAvg,
      assetReuseRatio: Number.isFinite(assetReuseRatio) ? assetReuseRatio : 0,
    },
    warnings,
    suggestions,
  };
}
