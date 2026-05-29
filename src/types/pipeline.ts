import type { LevelConfig } from "@/types/level";

export type ProductionManifest = {
  schemaVersion: 1;
  packageType: "match3d_production_package";
  name: string;
  version: string;
  exportedAt: string;
  exportedBy: "match-factory-level-workbench";
  summary: {
    levelCount: number;
    assetCount: number;
    itemSetCount: number;
    formulaPresetName?: string;
    avgDifficultyP?: number;
    minDifficultyP?: number;
    maxDifficultyP?: number;
    warningCount: number;
    missingAssetCount: number;
  };
  levels: Array<{
    levelId: string;
    levelIndex?: number;
    levelName: string;
    file: string;
    difficulty?: { P: number; label: string; M?: number; D?: number; T?: number };
    assetMissingCount: number;
    validationStatus: "valid" | "needs_review" | "invalid";
  }>;
  assets: Array<{
    assetId: string;
    name: string;
    displayName?: string;
    imageFile?: string;
    imageUrl?: string;
    sourceItemId?: number;
    role?: string;
  }>;
  reports: {
    difficultyReport: string;
    validationReport: string;
    anomalyReport?: string;
  };
  tables: {
    itemCatalog?: string;
    generatedItemSets?: string;
    levelSummary?: string;
  };
  formula?: { presetId?: string; name?: string; file?: string };
  playtest?: {
    avgPassRate: number;
    needsReviewCount: number;
    criticalIssueCount: number;
    reportFile: string;
  };
  analytics?: {
    batchId: string;
    avgPassRate?: number;
    highSeverityCount: number;
    formulaMismatchCount: number;
    playtestMismatchCount: number;
    reportFile: string;
  };
  compatibility: {
    levelConfigSchemaVersion: number;
    supportsUnityPreviewExport: boolean;
    supportsLvlPreviewExport: boolean;
    realLvlBinaryExport: false;
  };
};

export type PackageValidationResult = {
  isValid: boolean;
  status: "valid" | "needs_review" | "invalid";
  summary: {
    levelCount: number;
    assetCount: number;
    errorCount: number;
    warningCount: number;
    missingAssetCount: number;
    duplicateLevelIndexCount: number;
  };
  errors: Array<{ code: string; message: string; levelId?: string; levelName?: string; severity: "error" | "warning" }>;
  warnings: Array<{ code: string; message: string; levelId?: string; levelName?: string; severity: "warning" }>;
};

export type ImportResult = {
  success: boolean;
  summary: string;
  total: number;
  passed: number;
  failed: number;
  items: Array<{ name: string; status: "ok" | "failed"; error?: string; level?: LevelConfig }>;
};
