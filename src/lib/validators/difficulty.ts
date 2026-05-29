import { z } from "zod";

import { levelConfigSchema } from "@/lib/validators/level";

export const difficultyFormulaConfigSchema = z.object({
  complexityWeights: z.object({
    Wtag: z.number().nonnegative(),
    Wsize: z.number().nonnegative(),
    Wqty: z.number().nonnegative(),
    Wtarget: z.number().nonnegative(),
    Wvisual: z.number().nonnegative(),
  }),
  attrWeights: z.object({
    category1: z.number().nonnegative(),
    category2: z.number().nonnegative(),
    color1: z.number().nonnegative(),
    color2: z.number().nonnegative(),
    shape: z.number().nonnegative(),
    size: z.number().nonnegative(),
  }),
  bucketWeights: z.object({
    high: z.number().nonnegative(),
    medium: z.number().nonnegative(),
    low: z.number().nonnegative(),
    none: z.number().nonnegative(),
  }),
  sizeWeights: z.object({
    small: z.number().nonnegative(),
    medium: z.number().nonnegative(),
    large: z.number().nonnegative(),
    unknown: z.number().nonnegative(),
  }),
  targetWeights: z.object({
    targetRatioWeight: z.number().nonnegative(),
    distractorRatioWeight: z.number().nonnegative(),
    targetTypeWeight: z.number().nonnegative(),
  }),
  visualWeights: z.object({
    colorWeight: z.number().nonnegative(),
    shapeWeight: z.number().nonnegative(),
    missingAssetWeight: z.number().nonnegative(),
  }),
  ruleWeights: z.object({
    generatorRuleWeight: z.number().nonnegative(),
    refreshRuleWeight: z.number().nonnegative(),
    layoutWeight: z.number().nonnegative(),
    layerWeight: z.number().nonnegative(),
  }),
  constants: z.object({
    baselineItemCount: z.number().positive(),
    baselineTime: z.number().positive(),
    K: z.number().positive(),
    minTimePressure: z.number().positive(),
    maxTimePressure: z.number().positive(),
  }),
  labelThresholds: z
    .object({
      easyMax: z.number().positive(),
      normalMax: z.number().positive(),
      hardMax: z.number().positive(),
    })
    .refine((v) => v.easyMax < v.normalMax && v.normalMax < v.hardMax, "label 阈值必须递增"),
});

export const difficultyDiagnosisResultSchema = z.object({
  levelId: z.string().optional(),
  levelName: z.string().optional(),
  score: z.object({
    M: z.number(),
    normalizedM: z.number(),
    D: z.number(),
    T: z.number(),
    P: z.number(),
    label: z.enum(["easy", "normal", "hard", "expert"]),
    confidence: z.number(),
  }),
  breakdown: z.object({
    itemComplexity: z.object({
      Ctag: z.number(),
      Csize: z.number(),
      Cqty: z.number(),
      Ctarget: z.number(),
      Cvisual: z.number(),
    }),
    similarity: z.object({
      totalPairs: z.number().int().nonnegative(),
      maxSimilarity: z.number(),
      avgSimilarity: z.number(),
      bucketCounts: z.object({ high: z.number(), medium: z.number(), low: z.number(), none: z.number() }),
      highSimilarityPairs: z.array(
        z.object({ itemA: z.string(), itemB: z.string(), similarity: z.number(), reasons: z.array(z.string()) }),
      ),
    }),
    distribution: z.object({
      totalSpawnCount: z.number().int().nonnegative(),
      targetTypeCount: z.number().int().nonnegative(),
      targetTotalCount: z.number().int().nonnegative(),
      distractorTypeCount: z.number().int().nonnegative(),
      distractorTotalCount: z.number().int().nonnegative(),
      targetRatio: z.number(),
      distractorRatio: z.number(),
      sizeDistribution: z.record(z.string(), z.number()),
      colorDistribution: z.record(z.string(), z.number()),
      shapeDistribution: z.record(z.string(), z.number()),
    }),
    ruleDifficulty: z.object({
      generatorRuleDifficulty: z.number(),
      refreshRuleDifficulty: z.number(),
      layoutDifficulty: z.number(),
      layerDifficulty: z.number(),
      S: z.number(),
      K: z.number(),
      D: z.number(),
    }),
    timePressure: z.object({
      baselineTime: z.number(),
      timeLimitSec: z.number(),
      rawT: z.number(),
      clampedT: z.number(),
    }),
  }),
  warnings: z.array(z.string()),
  suggestions: z.array(z.string()),
});

export const geminiDifficultyAdviceResultSchema = z.object({
  summary: z.string(),
  risks: z.array(z.string()),
  suggestions: z.array(
    z.object({
      priority: z.enum(["high", "medium", "low"]),
      title: z.string(),
      detail: z.string(),
      expectedEffect: z.string(),
    }),
  ),
  balancingAdvice: z.string(),
});

export const diagnoseRequestSchema = z.object({
  levelId: z.string().optional(),
  level: levelConfigSchema.optional(),
  formulaPresetId: z.string().optional(),
  formulaConfig: difficultyFormulaConfigSchema.optional(),
  saveRun: z.boolean().optional(),
});
