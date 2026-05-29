import type { DifficultyFormulaConfig } from "@/types/difficulty";
import type { LevelItemEntry } from "@/types/level";

import { similarValues } from "./defaultFormulaConfig";

const attrKeys: Array<keyof DifficultyFormulaConfig["attrWeights"]> = [
  "category1",
  "category2",
  "color1",
  "color2",
  "shape",
  "size",
];

function matchScore(a?: string, b?: string) {
  if (!a || !b) return 0;
  const x = a.toLowerCase();
  const y = b.toLowerCase();
  if (x === y) return 1;
  if ((similarValues[x] ?? []).includes(y) || (similarValues[y] ?? []).includes(x)) return 0.5;
  return 0;
}

export function calculateItemSimilarity(
  itemA: LevelItemEntry,
  itemB: LevelItemEntry,
  config: DifficultyFormulaConfig,
) {
  let weighted = 0;
  let total = 0;
  const reasons: string[] = [];
  for (const key of attrKeys) {
    const w = config.attrWeights[key];
    const a = itemA[key];
    const b = itemB[key];
    const m = matchScore(a, b);
    weighted += w * m;
    total += w;
    if (m >= 0.5 && a && b) reasons.push(`${key}:${a}~${b}`);
  }
  return { similarity: total ? weighted / total : 0, reasons };
}

export function calculateSimilarityMatrix(items: LevelItemEntry[], config: DifficultyFormulaConfig) {
  const matrix = Array.from({ length: items.length }, () => Array.from({ length: items.length }, () => 0));
  const pairs: Array<{ itemA: string; itemB: string; similarity: number; reasons: string[] }> = [];
  const bucketCounts = { high: 0, medium: 0, low: 0, none: 0 };
  let maxSimilarity = 0;
  let sum = 0;
  let count = 0;

  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      const { similarity, reasons } = calculateItemSimilarity(items[i], items[j], config);
      matrix[i][j] = similarity;
      matrix[j][i] = similarity;
      pairs.push({ itemA: items[i].name, itemB: items[j].name, similarity, reasons });
      if (similarity >= 0.75) bucketCounts.high += 1;
      else if (similarity >= 0.5) bucketCounts.medium += 1;
      else if (similarity >= 0.25) bucketCounts.low += 1;
      else bucketCounts.none += 1;
      maxSimilarity = Math.max(maxSimilarity, similarity);
      sum += similarity;
      count += 1;
    }
  }

  return {
    matrix,
    pairs,
    bucketCounts,
    maxSimilarity,
    avgSimilarity: count ? sum / count : 0,
  };
}
