import { z } from "zod";

import { difficultyDiagnosisResultSchema, difficultyFormulaConfigSchema } from "@/lib/validators/difficulty";
import { levelConfigSchema } from "@/lib/validators/level";

export const autoGenerateLevelsInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  sourceLevelIds: z.array(z.string()).min(1),
  formulaPresetId: z.string().optional(),
  generateCount: z.number().int().positive().max(50),
  candidatesPerLevel: z.number().int().positive().max(10),
  targetStartIndex: z.number().int().optional(),
  curveConfig: z.object({
    curveType: z.enum(["smooth_growth", "wave", "hard_every_5", "plateau_then_rise", "custom"]),
    growthRate: z.number(),
    waveAmplitude: z.number().optional(),
    hardSpikeInterval: z.number().int().optional(),
    hardSpikeStrength: z.number().optional(),
    maxP: z.number().optional(),
    minP: z.number().optional(),
    customTargets: z.array(z.object({ levelIndex: z.number().int(), targetP: z.number() })).optional(),
  }),
  generationConstraints: z.object({
    sameThemeOnly: z.boolean(),
    allowNewItemSet: z.boolean(),
    maxNewItemsPerLevel: z.number().int().nonnegative(),
    reuseExistingAssets: z.boolean(),
    preferredGeneratorRules: z.array(z.string()).optional(),
    preferredRefreshRules: z.array(z.string()).optional(),
    bannedCategories: z.array(z.string()).optional(),
    preferredCategories: z.array(z.string()).optional(),
    noveltyRate: z.number().min(0).max(1),
  }),
});

export const autoCandidateSchema = z.object({
  candidateId: z.string().optional(),
  candidateRank: z.number().int(),
  actualP: z.number(),
  distance: z.number(),
  level: levelConfigSchema,
  diagnosis: difficultyDiagnosisResultSchema,
  validation: z.unknown(),
  aiReason: z.string().optional(),
  warnings: z.array(z.string()),
  status: z.enum(["candidate", "needs_review", "failed"]),
});

export const autoGenerateLevelsResultSchema = z.object({
  runId: z.string(),
  summary: z.string(),
  warnings: z.array(z.string()),
  sourceAnalysis: z.unknown(),
  targetCurve: z.array(
    z.object({
      levelIndex: z.number().int(),
      targetP: z.number(),
      label: z.enum(["easy", "normal", "hard", "expert"]),
      reason: z.string(),
    }),
  ),
  generated: z.array(
    z.object({
      targetLevelIndex: z.number().int(),
      targetP: z.number(),
      candidates: z.array(autoCandidateSchema),
    }),
  ),
});

export const batchReplaySchema = z.object({
  levelIds: z.array(z.string()).optional(),
  recentCount: z.number().int().positive().optional(),
  formulaPresetId: z.string().optional(),
  formulaConfig: difficultyFormulaConfigSchema.optional(),
});
