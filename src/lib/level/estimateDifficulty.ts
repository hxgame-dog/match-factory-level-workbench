import type { LevelConfig } from "@/types/level";

const baselineTime = 180;

export function estimateBasicDifficulty(input: {
  level: LevelConfig;
  generatorRuleDifficulty: number;
  refreshRuleDifficulty: number;
}) {
  const level = input.level;
  const spawnTotal = level.spawns.reduce((sum, item) => sum + item.count, 0);
  const targetTypes = new Set(level.targets.map((item) => item.name)).size;
  const distractorCount = level.spawns.filter((item) => item.role === "distractor").length;
  const visualSimilarityFactor =
    new Set(level.spawns.map((item) => `${item.color1 ?? "_"}-${item.shape ?? "_"}`)).size /
    Math.max(1, level.spawns.length);

  const normalizedSpawnCount = Math.min(1.8, spawnTotal / 120);
  const targetTypeFactor = Math.min(1.5, targetTypes / 4);
  const distractorRatio = Math.min(1.8, distractorCount / Math.max(1, level.spawns.length));

  const itemComplexity =
    0.35 * normalizedSpawnCount +
    0.25 * targetTypeFactor +
    0.2 * distractorRatio +
    0.2 * (1.5 - visualSimilarityFactor);

  const ruleDifficulty = (input.generatorRuleDifficulty + input.refreshRuleDifficulty) / 2;
  const timePressure = baselineTime / Math.max(1, level.rules.timeLimitSec);
  const finalDifficulty = itemComplexity * ruleDifficulty * timePressure;

  const label =
    finalDifficulty < 0.8
      ? "easy"
      : finalDifficulty < 1.2
        ? "normal"
        : finalDifficulty < 1.6
          ? "hard"
          : "expert";

  const warnings: string[] = [];
  const suggestions: string[] = [];
  if (timePressure > 1.3) warnings.push("时间压力较高");
  if (distractorRatio > 0.45) warnings.push("干扰物比例较高");
  if (label === "expert") suggestions.push("建议增加教程引导或降低视觉相似度");

  return {
    itemComplexity,
    ruleDifficulty,
    timePressure,
    finalDifficulty,
    label,
    warnings,
    suggestions,
  };
}
