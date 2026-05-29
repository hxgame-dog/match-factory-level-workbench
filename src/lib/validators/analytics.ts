import { z } from "zod";

export const standardAnalyticsRowSchema = z.object({
  levelId: z.string().optional(),
  levelIndex: z.number().int().optional(),
  levelName: z.string().optional(),
  users: z.number().nonnegative().optional(),
  starts: z.number().nonnegative().optional(),
  completes: z.number().nonnegative().optional(),
  fails: z.number().nonnegative().optional(),
  quits: z.number().nonnegative().optional(),
  retries: z.number().nonnegative().optional(),
  passRate: z.number().optional(),
  failRate: z.number().optional(),
  quitRate: z.number().optional(),
  retryRate: z.number().optional(),
  avgDurationSec: z.number().optional(),
  avgRemainingTimeSec: z.number().optional(),
  avgMoves: z.number().optional(),
  avgBoostersUsed: z.number().optional(),
  avgHintsUsed: z.number().optional(),
  avgShuffleUsed: z.number().optional(),
  revenue: z.number().optional(),
  adImpressions: z.number().optional(),
  iapPurchases: z.number().optional(),
  raw: z.record(z.string(), z.unknown()).optional(),
});

export const importDryRunSchema = z.object({
  batchName: z.string().min(1),
  source: z.enum(["mock", "firebase_export", "bigquery_export", "custom_csv", "manual"]).default("custom_csv"),
  fileContent: z.string().min(1),
  fileType: z.enum(["csv", "json", "excel"]).default("csv"),
  fieldMapping: z.record(z.string(), z.string()).optional(),
});

export const importConfirmSchema = importDryRunSchema;

export const mockGenerateSchema = z.object({
  batchName: z.string().min(1),
  mode: z.enum(["mixed", "hard", "easy"]).default("mixed"),
  levelIds: z.array(z.string()).optional(),
});

export const diagnoseBatchSchema = z.object({
  batchId: z.string(),
  formulaPresetId: z.string().optional(),
  includePlaytest: z.boolean().optional(),
  saveResults: z.boolean().optional(),
  writeBackToLevels: z.boolean().optional(),
});

export const diagnoseLevelSchema = z.object({
  levelId: z.string(),
  analyticsBatchId: z.string().optional(),
  formulaPresetId: z.string().optional(),
  includePlaytest: z.boolean().optional(),
});

export const optimizationGenerateSchema = z.object({
  levelId: z.string(),
  diagnosisId: z.string(),
  mode: z.enum(["conservative", "balanced", "aggressive"]).default("balanced"),
});

export const geminiAnalyticsAdviceResultSchema = z.object({
  summary: z.string(),
  keyFindings: z.array(z.string()),
  rootCauseHypotheses: z.array(
    z.object({
      title: z.string(),
      confidence: z.enum(["low", "medium", "high"]),
      detail: z.string(),
    }),
  ),
  optimizationSuggestions: z.array(
    z.object({
      priority: z.enum(["high", "medium", "low"]),
      action: z.string(),
      detail: z.string(),
      expectedMetricImpact: z.string(),
    }),
  ),
  formulaCalibrationNotes: z.string(),
  playtestCalibrationNotes: z.string(),
});
