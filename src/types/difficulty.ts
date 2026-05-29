import type { LevelConfig } from "@/types/level";

export type DifficultyFormulaConfig = {
  complexityWeights: { Wtag: number; Wsize: number; Wqty: number; Wtarget: number; Wvisual: number };
  attrWeights: { category1: number; category2: number; color1: number; color2: number; shape: number; size: number };
  bucketWeights: { high: number; medium: number; low: number; none: number };
  sizeWeights: { small: number; medium: number; large: number; unknown: number };
  targetWeights: { targetRatioWeight: number; distractorRatioWeight: number; targetTypeWeight: number };
  visualWeights: { colorWeight: number; shapeWeight: number; missingAssetWeight: number };
  ruleWeights: { generatorRuleWeight: number; refreshRuleWeight: number; layoutWeight: number; layerWeight: number };
  constants: {
    baselineItemCount: number;
    baselineTime: number;
    K: number;
    minTimePressure: number;
    maxTimePressure: number;
  };
  labelThresholds: { easyMax: number; normalMax: number; hardMax: number };
};

export type DifficultyDiagnosisResult = {
  levelId?: string;
  levelName?: string;
  score: {
    M: number;
    normalizedM: number;
    D: number;
    T: number;
    P: number;
    label: "easy" | "normal" | "hard" | "expert";
    confidence: number;
  };
  breakdown: {
    itemComplexity: { Ctag: number; Csize: number; Cqty: number; Ctarget: number; Cvisual: number };
    similarity: {
      totalPairs: number;
      maxSimilarity: number;
      avgSimilarity: number;
      bucketCounts: { high: number; medium: number; low: number; none: number };
      highSimilarityPairs: Array<{ itemA: string; itemB: string; similarity: number; reasons: string[] }>;
    };
    distribution: {
      totalSpawnCount: number;
      targetTypeCount: number;
      targetTotalCount: number;
      distractorTypeCount: number;
      distractorTotalCount: number;
      targetRatio: number;
      distractorRatio: number;
      sizeDistribution: Record<string, number>;
      colorDistribution: Record<string, number>;
      shapeDistribution: Record<string, number>;
    };
    ruleDifficulty: {
      generatorRuleDifficulty: number;
      refreshRuleDifficulty: number;
      layoutDifficulty: number;
      layerDifficulty: number;
      S: number;
      K: number;
      D: number;
    };
    timePressure: {
      baselineTime: number;
      timeLimitSec: number;
      rawT: number;
      clampedT: number;
    };
  };
  warnings: string[];
  suggestions: string[];
};

export type GeminiDifficultyAdviceInput = { level: LevelConfig; diagnosis: DifficultyDiagnosisResult };
export type GeminiDifficultyAdviceResult = {
  summary: string;
  risks: string[];
  suggestions: Array<{ priority: "high" | "medium" | "low"; title: string; detail: string; expectedEffect: string }>;
  balancingAdvice: string;
};

export type DifficultyAnomaly = {
  levelId: string;
  levelName: string;
  levelIndex?: number;
  type: "spike" | "drop" | "too_hard" | "too_easy" | "warning_heavy";
  severity: "high" | "medium" | "low";
  message: string;
};
