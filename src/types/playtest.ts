import type { DifficultyDiagnosisResult } from "@/types/difficulty";
import type { LevelConfig } from "@/types/level";

export type PlayerProfile = {
  id: string;
  name: string;
  weight: number;
  skillLevel: "beginner" | "normal" | "advanced" | "expert";
  scanSpeed: number;
  mistakeRate: number;
  targetPriority: number;
  distractorClickChance: number;
  memoryFactor: number;
  panicFactor: number;
};

export type SimulatorConfig = {
  simulationCount: number;
  playerProfiles: PlayerProfile[];
  rules: {
    slotCapacity: number;
    matchRequiredCount: number;
    timeLimitSecOverride?: number;
    allowShuffleAssist: boolean;
    allowHintAssist: boolean;
    allowBoosterAssist: boolean;
  };
  strategy: {
    selectionStrategy: "target_first" | "visible_easy_first" | "random_weighted" | "risk_aware" | "panic_random";
    considerSimilarity: boolean;
    considerSize: boolean;
    considerLayerBlocking: boolean;
    considerRefreshRules: boolean;
  };
  qaThresholds: {
    minPassRate: number;
    maxPassRate: number;
    minAvgRemainingTime: number;
    maxAvgRemainingTime: number;
    maxSlotPressure: number;
    maxTargetStarvationTurns: number;
    maxWarningCount: number;
  };
};

export type PlayableItem = {
  instanceId: string;
  name: string;
  role: string;
  category1?: string;
  color1?: string;
  shape?: string;
  size?: string;
  layer?: number;
  visible: boolean;
  collected: boolean;
  targetRequired: boolean;
};

export type PlayableState = {
  itemPool: PlayableItem[];
  targetsRemaining: Record<string, number>;
  slot: string[];
  timeLimitSec: number;
  warnings: string[];
};

export type PlayerRunResult = {
  profileId: string;
  profileName: string;
  passed: boolean;
  completionTime?: number;
  remainingTime?: number;
  moves: number;
  failReason?: "timeout" | "slot_full" | "target_not_found" | "target_insufficient" | "invalid_level" | "simulation_error";
  slotPressureAvg: number;
  slotPressureMax: number;
  targetStarvationTurns: number;
  firstTargetFoundTime?: number;
  wastedMoveRatio: number;
};

export type PlaytestLevelSimulationResult = {
  levelId: string;
  levelName: string;
  levelIndex?: number;
  status: "completed" | "needs_review" | "failed" | "invalid_level";
  metrics: {
    passRate: number;
    failRate: number;
    avgCompletionTime: number;
    avgRemainingTime: number;
    avgMoves: number;
    avgSlotPressure: number;
    maxSlotPressure: number;
    targetCompletionRate: number;
    targetStarvationTurnsAvg: number;
    firstTargetFoundTimeAvg: number;
    wastedMoveRatio: number;
  };
  profileBreakdown: Array<{
    profileId: string;
    profileName: string;
    passRate: number;
    avgCompletionTime: number;
    avgRemainingTime: number;
    avgMoves: number;
    mainFailReason?: string;
  }>;
  failReasons: Array<{ reason: "timeout" | "slot_full" | "target_not_found" | "target_insufficient" | "invalid_level" | "simulation_error"; count: number; ratio: number }>;
  qaIssues: Array<{ code: string; severity: "critical" | "high" | "medium" | "low"; title: string; detail: string; affectedMetric?: string }>;
  balanceSuggestions: Array<{ priority: "high" | "medium" | "low"; action: "increase_time" | "decrease_time" | "reduce_distractors" | "increase_distractors" | "reduce_similarity" | "increase_similarity" | "increase_target_count" | "reduce_spawn_count" | "change_refresh_rule" | "change_generator_rule" | "adjust_layout"; detail: string; expectedEffect: string }>;
  rawSamples?: Array<{ sampleId: number; profileId: string; passed: boolean; completionTime?: number; remainingTime?: number; moves: number; failReason?: string; slotPressureAvg: number }>;
};

export type PlaytestSimulationResult = {
  runId?: string;
  summary: {
    levelCount: number;
    simulationCountPerLevel: number;
    avgPassRate: number;
    avgCompletionTime: number;
    avgRemainingTime: number;
    totalIssueCount: number;
    needsReviewCount: number;
  };
  results: PlaytestLevelSimulationResult[];
};

export type GeminiPlaytestAdviceInput = {
  level?: LevelConfig;
  playtestResult: PlaytestLevelSimulationResult;
  formulaDiagnosis?: DifficultyDiagnosisResult;
};

export type GeminiPlaytestAdviceResult = {
  summary: string;
  keyFindings: string[];
  riskLevel: "low" | "medium" | "high" | "critical";
  suggestions: Array<{ priority: "high" | "medium" | "low"; action: string; detail: string; expectedImpact: string }>;
  designerNotes: string;
};
