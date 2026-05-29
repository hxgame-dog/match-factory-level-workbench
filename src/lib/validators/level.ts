import { z } from "zod";

const roleSchema = z.enum(["target", "distractor", "filler", "special"]);
const difficultySchema = z.enum(["easy", "normal", "hard", "expert"]);
const layoutModeSchema = z.enum(["flat", "stacked", "clustered", "random"]);

export const levelItemEntrySchema = z.object({
  generatedItemId: z.string().optional(),
  sourceItemId: z.number().int().optional(),
  catalogItemId: z.string().optional(),
  name: z.string().min(1),
  displayName: z.string().optional(),
  category1: z.string().min(1),
  category2: z.string().optional(),
  color1: z.string().optional(),
  color2: z.string().optional(),
  shape: z.string().optional(),
  size: z.string().optional(),
  role: roleSchema,
  count: z.number().int().positive(),
  assetKey: z.string().optional(),
});

export const levelConfigSchema = z.object({
  levelId: z.string().min(1),
  levelIndex: z.number().int().optional(),
  name: z.string().min(1),
  theme: z.string().optional(),
  source: z.object({
    itemSetId: z.string().min(1),
    assetBatchId: z.string().optional(),
    generatedBy: z.enum(["gemini", "mock", "manual"]),
  }),
  meta: z.object({
    version: z.number().int().positive(),
    createdAt: z.string(),
    updatedAt: z.string().optional(),
    notes: z.string().optional(),
  }),
  rules: z.object({
    generatorRuleId: z.string().min(1),
    refreshRuleId: z.string().min(1),
    timeLimitSec: z.number().int().positive(),
    slotCount: z.number().int().positive(),
    targetDifficulty: difficultySchema,
  }),
  board: z.object({
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    layerCount: z.number().int().positive(),
    layoutMode: layoutModeSchema,
  }),
  targets: z.array(levelItemEntrySchema).min(1),
  spawns: z.array(levelItemEntrySchema).min(1),
  assets: z.record(
    z.string(),
    z.object({
      imageUrl: z.string().optional(),
      localPath: z.string().optional(),
      prompt: z.string().optional(),
    }),
  ),
  diagnostics: z
    .object({
      estimatedItemComplexity: z.number().optional(),
      estimatedRuleDifficulty: z.number().optional(),
      estimatedTimePressure: z.number().optional(),
      estimatedFinalDifficulty: z.number().optional(),
      warnings: z.array(z.string()).optional(),
      suggestions: z.array(z.string()).optional(),
    })
    .optional(),
});

export const generateLevelInputSchema = z.object({
  levelName: z.string().min(1),
  levelIndex: z.number().int().optional(),
  targetDifficulty: difficultySchema,
  candidateCount: z.number().int().min(1).max(5),
  source: z.object({
    itemSetId: z.string().min(1),
    assetBatchId: z.string().optional(),
  }),
  config: z.object({
    timeLimitSec: z.number().int().positive(),
    slotCount: z.number().int().positive(),
    boardWidth: z.number().int().positive(),
    boardHeight: z.number().int().positive(),
    layerCount: z.number().int().positive(),
    layoutMode: layoutModeSchema,
    generatorRuleId: z.string().min(1),
    refreshRuleId: z.string().min(1),
  }),
  items: z.array(levelItemEntrySchema).min(1),
  assets: z
    .array(
      z.object({
        generatedItemId: z.string().optional(),
        name: z.string(),
        imageUrl: z.string().optional(),
        localPath: z.string().optional(),
        prompt: z.string().optional(),
      }),
    )
    .optional(),
  rulePresets: z.object({
    generatorRule: z.object({
      id: z.string(),
      name: z.string(),
      difficultyValue: z.number(),
      description: z.string(),
    }),
    refreshRule: z.object({
      id: z.string(),
      name: z.string(),
      difficultyValue: z.number(),
      description: z.string(),
    }),
  }),
});

export const generateLevelResultSchema = z.object({
  summary: z.string(),
  warnings: z.array(z.string()).default([]),
  candidates: z.array(levelConfigSchema),
});
