import type { DifficultyDiagnosisResult } from "@/types/difficulty";
import type { ProductionManifest } from "@/types/pipeline";
import type { LevelConfig } from "@/types/level";
import type { PackageValidationResult } from "@/types/pipeline";

export function buildManifest(input: {
  name: string;
  version: string;
  levels: LevelConfig[];
  diagnoses: Map<string, DifficultyDiagnosisResult>;
  validation: PackageValidationResult;
  assets: Array<{ id: string; name: string; displayName?: string | null; imageUrl?: string | null; sourceItemId?: number | null; role?: string | null }>;
  formula?: { id: string; name: string } | null;
  playtest?: { avgPassRate: number; needsReviewCount: number; criticalIssueCount: number } | null;
  analytics?: { batchId: string; avgPassRate?: number; highSeverityCount: number; formulaMismatchCount: number; playtestMismatchCount: number } | null;
}): ProductionManifest {
  const scores = [...input.diagnoses.values()].map((d) => d.score.P);
  return {
    schemaVersion: 1,
    packageType: "match3d_production_package",
    name: input.name,
    version: input.version,
    exportedAt: new Date().toISOString(),
    exportedBy: "match-factory-level-workbench",
    summary: {
      levelCount: input.levels.length,
      assetCount: input.assets.length,
      itemSetCount: new Set(input.levels.map((l) => l.source.itemSetId)).size,
      formulaPresetName: input.formula?.name,
      avgDifficultyP: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : undefined,
      minDifficultyP: scores.length ? Math.min(...scores) : undefined,
      maxDifficultyP: scores.length ? Math.max(...scores) : undefined,
      warningCount: input.validation.summary.warningCount,
      missingAssetCount: input.validation.summary.missingAssetCount,
    },
    levels: input.levels.map((level, idx) => {
      const diagnosis = input.diagnoses.get(level.levelId);
      const missing = level.spawns.filter((s) => s.assetKey && !level.assets[s.assetKey]).length;
      return {
        levelId: level.levelId,
        levelIndex: level.levelIndex,
        levelName: level.name,
        file: `levels/level_${String(level.levelIndex ?? idx + 1).padStart(3, "0")}.json`,
        difficulty: diagnosis
          ? { P: diagnosis.score.P, label: diagnosis.score.label, M: diagnosis.score.M, D: diagnosis.score.D, T: diagnosis.score.T }
          : undefined,
        assetMissingCount: missing,
        validationStatus: missing > 0 ? "needs_review" : "valid",
      };
    }),
    assets: input.assets.map((asset) => ({
      assetId: asset.id,
      name: asset.name,
      displayName: asset.displayName ?? undefined,
      imageUrl: asset.imageUrl ?? undefined,
      imageFile: asset.imageUrl ? `assets/images/${asset.name}.svg` : undefined,
      sourceItemId: asset.sourceItemId ?? undefined,
      role: asset.role ?? undefined,
    })),
    reports: {
      difficultyReport: "reports/difficulty_report.json",
      validationReport: "reports/validation_report.json",
      anomalyReport: "reports/anomaly_report.json",
    },
    tables: {
      itemCatalog: "tables/item_catalog.xlsx",
      generatedItemSets: "tables/generated_item_sets.xlsx",
      levelSummary: "tables/level_summary.xlsx",
    },
    formula: input.formula ? { presetId: input.formula.id, name: input.formula.name, file: "formula/formula_preset.json" } : undefined,
    playtest: input.playtest
      ? {
          avgPassRate: input.playtest.avgPassRate,
          needsReviewCount: input.playtest.needsReviewCount,
          criticalIssueCount: input.playtest.criticalIssueCount,
          reportFile: "reports/playtest_report.json",
        }
      : undefined,
    analytics: input.analytics
      ? {
          batchId: input.analytics.batchId,
          avgPassRate: input.analytics.avgPassRate,
          highSeverityCount: input.analytics.highSeverityCount,
          formulaMismatchCount: input.analytics.formulaMismatchCount,
          playtestMismatchCount: input.analytics.playtestMismatchCount,
          reportFile: "reports/analytics_feedback_report.json",
        }
      : undefined,
    compatibility: {
      levelConfigSchemaVersion: 1,
      supportsUnityPreviewExport: true,
      supportsLvlPreviewExport: true,
      realLvlBinaryExport: false,
    },
  };
}
