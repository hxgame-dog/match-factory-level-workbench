import type { DifficultyDiagnosisResult, DifficultyFormulaConfig } from "@/types/difficulty";
import type { LevelConfig } from "@/types/level";

export type AutoGenerateLevelsInput = {
  name: string;
  description?: string;
  sourceLevelIds: string[];
  formulaPresetId?: string;
  generateCount: number;
  candidatesPerLevel: number;
  targetStartIndex?: number;
  curveConfig: {
    curveType: "smooth_growth" | "wave" | "hard_every_5" | "plateau_then_rise" | "custom";
    growthRate: number;
    waveAmplitude?: number;
    hardSpikeInterval?: number;
    hardSpikeStrength?: number;
    maxP?: number;
    minP?: number;
    customTargets?: Array<{ levelIndex: number; targetP: number }>;
  };
  generationConstraints: {
    sameThemeOnly: boolean;
    allowNewItemSet: boolean;
    maxNewItemsPerLevel: number;
    reuseExistingAssets: boolean;
    preferredGeneratorRules?: string[];
    preferredRefreshRules?: string[];
    bannedCategories?: string[];
    preferredCategories?: string[];
    noveltyRate: number;
  };
};

export type SourceLevelPatternAnalysis = {
  count: number;
  difficulty: {
    avgP: number;
    minP: number;
    maxP: number;
    trend: "rising" | "falling" | "stable" | "wave" | "unknown";
    avgGrowth: number;
    volatility: number;
  };
  structure: {
    avgTimeLimitSec: number;
    avgSlotCount: number;
    avgBoardWidth: number;
    avgBoardHeight: number;
    avgLayerCount: number;
    commonLayoutModes: Array<{ value: string; count: number }>;
  };
  items: {
    avgTargetTypeCount: number;
    avgTargetTotalCount: number;
    avgSpawnTypeCount: number;
    avgSpawnTotalCount: number;
    avgDistractorRatio: number;
    commonCategories: Array<{ value: string; count: number }>;
    commonColors: Array<{ value: string; count: number }>;
    commonShapes: Array<{ value: string; count: number }>;
    commonSizes: Array<{ value: string; count: number }>;
  };
  rules: {
    commonGeneratorRules: Array<{ id: string; count: number }>;
    commonRefreshRules: Array<{ id: string; count: number }>;
  };
  assets: {
    missingAssetAvg: number;
    assetReuseRatio: number;
  };
  warnings: string[];
  suggestions: string[];
};

export type AutoGenerateLevelsResult = {
  runId: string;
  summary: string;
  warnings: string[];
  sourceAnalysis: SourceLevelPatternAnalysis;
  targetCurve: Array<{
    levelIndex: number;
    targetP: number;
    label: "easy" | "normal" | "hard" | "expert";
    reason: string;
  }>;
  generated: Array<{
    targetLevelIndex: number;
    targetP: number;
    candidates: Array<{
      candidateId?: string;
      candidateRank: number;
      actualP: number;
      distance: number;
      level: LevelConfig;
      diagnosis: DifficultyDiagnosisResult;
      validation: unknown;
      aiReason?: string;
      warnings: string[];
      status: "candidate" | "needs_review" | "failed";
    }>;
  }>;
};

export type AutoGenerationContext = {
  formulaConfig: DifficultyFormulaConfig;
  availableLevels: Array<{ id: string; level: LevelConfig; name: string }>;
};
