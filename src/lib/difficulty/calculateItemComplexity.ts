import type { DifficultyFormulaConfig } from "@/types/difficulty";
import type { LevelConfig } from "@/types/level";

import { calculateSimilarityMatrix } from "./similarity";

function toSizeKey(size?: string) {
  const s = (size ?? "unknown").toLowerCase();
  if (s.includes("small") || s === "s") return "small";
  if (s.includes("large") || s === "l") return "large";
  if (s.includes("medium") || s === "m") return "medium";
  return "unknown";
}

export function calculateItemComplexity(level: LevelConfig, config: DifficultyFormulaConfig) {
  const similarity = calculateSimilarityMatrix(level.spawns, config);
  const totalPairs = Math.max(1, similarity.pairs.length);
  const Ctag =
    (config.bucketWeights.high * similarity.bucketCounts.high +
      config.bucketWeights.medium * similarity.bucketCounts.medium +
      config.bucketWeights.low * similarity.bucketCounts.low +
      config.bucketWeights.none * similarity.bucketCounts.none) /
    totalPairs;

  const sizeDistribution: Record<string, number> = {};
  const colorDistribution: Record<string, number> = {};
  const shapeDistribution: Record<string, number> = {};
  let sizeScoreSum = 0;
  let totalSpawnCount = 0;
  let targetTotalCount = 0;
  let distractorTotalCount = 0;
  const targetTypes = new Set<string>();
  const distractorTypes = new Set<string>();

  for (const item of level.spawns) {
    totalSpawnCount += item.count;
    const sizeKey = toSizeKey(item.size);
    sizeDistribution[sizeKey] = (sizeDistribution[sizeKey] ?? 0) + item.count;
    sizeScoreSum += config.sizeWeights[sizeKey] * item.count;
    if (item.color1) colorDistribution[item.color1] = (colorDistribution[item.color1] ?? 0) + item.count;
    if (item.shape) shapeDistribution[item.shape] = (shapeDistribution[item.shape] ?? 0) + item.count;
    if (item.role === "target") {
      targetTotalCount += item.count;
      targetTypes.add(item.name);
    } else if (item.role === "distractor") {
      distractorTotalCount += item.count;
      distractorTypes.add(item.name);
    }
  }
  const total = Math.max(1, totalSpawnCount);
  const Csize = sizeScoreSum / total;
  const Cqty = Math.log(1 + totalSpawnCount) / Math.log(1 + config.constants.baselineItemCount);
  const targetRatio = targetTotalCount / total;
  const distractorRatio = distractorTotalCount / total;
  const normalizedTargetTypeCount = targetTypes.size / Math.max(1, level.targets.length);
  const Ctarget =
    config.targetWeights.targetRatioWeight * targetRatio +
    config.targetWeights.distractorRatioWeight * distractorRatio +
    config.targetWeights.targetTypeWeight * normalizedTargetTypeCount;

  const topColor = Math.max(0, ...Object.values(colorDistribution));
  const topShape = Math.max(0, ...Object.values(shapeDistribution));
  const colorConflictScore = topColor / total;
  const shapeConflictScore = topShape / total;
  const missingAssetRatio =
    level.spawns.filter((item) => item.assetKey && !level.assets[item.assetKey]).length / Math.max(1, level.spawns.length);
  const Cvisual =
    colorConflictScore * config.visualWeights.colorWeight +
    shapeConflictScore * config.visualWeights.shapeWeight +
    missingAssetRatio * config.visualWeights.missingAssetWeight;

  const M =
    config.complexityWeights.Wtag * Ctag +
    config.complexityWeights.Wsize * Csize +
    config.complexityWeights.Wqty * Cqty +
    config.complexityWeights.Wtarget * Ctarget +
    config.complexityWeights.Wvisual * Cvisual;

  const normalizedM = Math.max(0.1, Math.min(2.5, M));
  const warnings: string[] = [];
  const suggestions: string[] = [];
  if ((sizeDistribution.small ?? 0) / total > 0.45) warnings.push("小尺寸道具占比过高");
  if (missingAssetRatio > 0.2) warnings.push("资源缺失比例较高");
  if (similarity.maxSimilarity > 0.85) suggestions.push("降低高相似度道具对数量以减压");

  return {
    M,
    normalizedM,
    components: { Ctag, Csize, Cqty, Ctarget, Cvisual },
    distribution: {
      totalSpawnCount,
      targetTypeCount: targetTypes.size,
      targetTotalCount,
      distractorTypeCount: distractorTypes.size,
      distractorTotalCount,
      targetRatio,
      distractorRatio,
      sizeDistribution,
      colorDistribution,
      shapeDistribution,
    },
    similarity: {
      totalPairs: similarity.pairs.length,
      maxSimilarity: similarity.maxSimilarity,
      avgSimilarity: similarity.avgSimilarity,
      bucketCounts: similarity.bucketCounts,
      highSimilarityPairs: similarity.pairs
        .filter((pair) => pair.similarity >= 0.75)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 20),
    },
    warnings,
    suggestions,
  };
}
