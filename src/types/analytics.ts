import type { DifficultyDiagnosisResult } from "@/types/difficulty";
import type { LevelConfig } from "@/types/level";
import type { PlaytestLevelSimulationResult } from "@/types/playtest";

export type StandardLevelAnalyticsRow = {
  levelId?: string;
  levelIndex?: number;
  levelName?: string;

  users?: number;
  starts?: number;
  completes?: number;
  fails?: number;
  quits?: number;
  retries?: number;

  passRate?: number;
  failRate?: number;
  quitRate?: number;
  retryRate?: number;

  avgDurationSec?: number;
  avgRemainingTimeSec?: number;
  avgMoves?: number;
  avgBoostersUsed?: number;
  avgHintsUsed?: number;
  avgShuffleUsed?: number;

  revenue?: number;
  adImpressions?: number;
  iapPurchases?: number;

  raw?: Record<string, unknown>;
};

export type AnalyticsRowWarning = {
  row: number;
  field?: string;
  message: string;
};

export type AnalyticsImportPreview = {
  detectedFields: string[];
  fieldMapping: Record<string, string>;
  unmappedFields: string[];
  rows: StandardLevelAnalyticsRow[];
  warnings: AnalyticsRowWarning[];
  summary: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
  };
};

export type LevelFeedbackDiagnosisResult = {
  levelId?: string;
  levelIndex?: number;
  levelName?: string;

  dataQuality: {
    hasAnalytics: boolean;
    users?: number;
    starts?: number;
    confidence: "low" | "medium" | "high";
    warnings: string[];
  };

  analytics: {
    passRate?: number;
    failRate?: number;
    quitRate?: number;
    retryRate?: number;
    avgDurationSec?: number;
    avgRemainingTimeSec?: number;
    avgMoves?: number;
    avgBoostersUsed?: number;
    avgHintsUsed?: number;
    avgShuffleUsed?: number;
  };

  formula?: {
    P?: number;
    label?: string;
    M?: number;
    D?: number;
    T?: number;
  };

  playtest?: {
    passRate?: number;
    avgRemainingTime?: number;
    avgSlotPressure?: number;
    mainFailReason?: string;
  };

  comparison: {
    formulaVsAnalytics?: {
      expectedLabel?: string;
      actualLabel?: string;
      mismatchLevel: "none" | "low" | "medium" | "high";
      message: string;
    };
    playtestVsAnalytics?: {
      simulatedPassRate?: number;
      actualPassRate?: number;
      delta?: number;
      mismatchLevel: "none" | "low" | "medium" | "high";
      message: string;
    };
  };

  issueTags: Array<
    | "too_hard_real"
    | "too_easy_real"
    | "formula_underestimates"
    | "formula_overestimates"
    | "playtest_underestimates"
    | "playtest_overestimates"
    | "high_quit_rate"
    | "high_retry_rate"
    | "booster_dependency"
    | "low_data_confidence"
    | "healthy"
  >;

  severity: "healthy" | "low" | "medium" | "high" | "critical";

  suggestions: Array<{
    priority: "high" | "medium" | "low";
    action:
      | "increase_time"
      | "decrease_time"
      | "reduce_spawn_count"
      | "increase_spawn_count"
      | "reduce_distractors"
      | "increase_distractors"
      | "reduce_similarity"
      | "increase_similarity"
      | "change_refresh_rule"
      | "change_generator_rule"
      | "adjust_target_count"
      | "review_formula"
      | "review_playtest_model";
    detail: string;
    expectedEffect: string;
  }>;
};

export type GeminiAnalyticsAdviceInput = {
  level?: LevelConfig;
  analytics: StandardLevelAnalyticsRow;
  feedbackDiagnosis: LevelFeedbackDiagnosisResult;
  formulaDiagnosis?: DifficultyDiagnosisResult;
  playtestResult?: PlaytestLevelSimulationResult;
};

export type GeminiAnalyticsAdviceResult = {
  summary: string;
  keyFindings: string[];
  rootCauseHypotheses: Array<{
    title: string;
    confidence: "low" | "medium" | "high";
    detail: string;
  }>;
  optimizationSuggestions: Array<{
    priority: "high" | "medium" | "low";
    action: string;
    detail: string;
    expectedMetricImpact: string;
  }>;
  formulaCalibrationNotes: string;
  playtestCalibrationNotes: string;
};

export type OptimizationProposalResult = {
  proposalName: string;
  optimizedLevel: LevelConfig;
  diff: Array<{
    path: string;
    before: unknown;
    after: unknown;
    reason: string;
  }>;
  reason: string;
  warnings: string[];
};
