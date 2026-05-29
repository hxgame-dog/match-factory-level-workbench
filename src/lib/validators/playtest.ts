import { z } from "zod";

export const simulatorConfigSchema = z.object({
  simulationCount: z.number().int().positive(),
  playerProfiles: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        weight: z.number(),
        skillLevel: z.enum(["beginner", "normal", "advanced", "expert"]),
        scanSpeed: z.number(),
        mistakeRate: z.number(),
        targetPriority: z.number(),
        distractorClickChance: z.number(),
        memoryFactor: z.number(),
        panicFactor: z.number(),
      }),
    )
    .min(1),
  rules: z.object({
    slotCapacity: z.number().int().positive(),
    matchRequiredCount: z.number().int().positive(),
    timeLimitSecOverride: z.number().optional(),
    allowShuffleAssist: z.boolean(),
    allowHintAssist: z.boolean(),
    allowBoosterAssist: z.boolean(),
  }),
  strategy: z.object({
    selectionStrategy: z.enum(["target_first", "visible_easy_first", "random_weighted", "risk_aware", "panic_random"]),
    considerSimilarity: z.boolean(),
    considerSize: z.boolean(),
    considerLayerBlocking: z.boolean(),
    considerRefreshRules: z.boolean(),
  }),
  qaThresholds: z.object({
    minPassRate: z.number(),
    maxPassRate: z.number(),
    minAvgRemainingTime: z.number(),
    maxAvgRemainingTime: z.number(),
    maxSlotPressure: z.number(),
    maxTargetStarvationTurns: z.number(),
    maxWarningCount: z.number(),
  }),
});

export const simulateLevelInputSchema = z.object({
  levelId: z.string(),
  config: simulatorConfigSchema,
  includeRawSamples: z.boolean().optional(),
  saveRun: z.boolean().optional(),
});

export const simulateBatchInputSchema = z.object({
  levelIds: z.array(z.string()).min(1),
  config: simulatorConfigSchema,
  runName: z.string().min(1),
  includeRawSamples: z.boolean().optional(),
  writeBackToLevels: z.boolean().optional(),
});

const playtestMetricsSchema = z.object({
  passRate: z.number(),
  failRate: z.number(),
  avgCompletionTime: z.number(),
  avgRemainingTime: z.number(),
  avgMoves: z.number(),
  avgSlotPressure: z.number(),
  maxSlotPressure: z.number(),
  targetCompletionRate: z.number(),
  targetStarvationTurnsAvg: z.number(),
  firstTargetFoundTimeAvg: z.number(),
  wastedMoveRatio: z.number(),
});

export const playtestLevelSimulationResultSchema = z.object({
  levelId: z.string(),
  levelName: z.string(),
  levelIndex: z.number().optional(),
  status: z.enum(["completed", "needs_review", "failed", "invalid_level"]),
  metrics: playtestMetricsSchema,
  profileBreakdown: z.array(z.unknown()),
  failReasons: z.array(z.unknown()),
  qaIssues: z.array(z.unknown()),
  balanceSuggestions: z.array(z.unknown()),
  rawSamples: z.array(z.unknown()).optional(),
});

export const geminiPlaytestAdviceResultSchema = z.object({
  summary: z.string(),
  keyFindings: z.array(z.string()),
  riskLevel: z.enum(["low", "medium", "high", "critical"]),
  suggestions: z.array(
    z.object({
      priority: z.enum(["high", "medium", "low"]),
      action: z.string(),
      detail: z.string(),
      expectedImpact: z.string(),
    }),
  ),
  designerNotes: z.string(),
});
