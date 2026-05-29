import { z } from "zod";

import { levelConfigSchema } from "@/lib/validators/level";

export const productionManifestSchema = z.object({
  schemaVersion: z.literal(1),
  packageType: z.literal("match3d_production_package"),
  name: z.string(),
  version: z.string(),
  exportedAt: z.string(),
  exportedBy: z.literal("match-factory-level-workbench"),
  summary: z.object({
    levelCount: z.number().int(),
    assetCount: z.number().int(),
    itemSetCount: z.number().int(),
    formulaPresetName: z.string().optional(),
    avgDifficultyP: z.number().optional(),
    minDifficultyP: z.number().optional(),
    maxDifficultyP: z.number().optional(),
    warningCount: z.number().int(),
    missingAssetCount: z.number().int(),
  }),
  levels: z.array(
    z.object({
      levelId: z.string(),
      levelIndex: z.number().int().optional(),
      levelName: z.string(),
      file: z.string(),
      difficulty: z
        .object({
          P: z.number(),
          label: z.string(),
          M: z.number().optional(),
          D: z.number().optional(),
          T: z.number().optional(),
        })
        .optional(),
      assetMissingCount: z.number().int(),
      validationStatus: z.enum(["valid", "needs_review", "invalid"]),
    }),
  ),
  assets: z.array(
    z.object({
      assetId: z.string(),
      name: z.string(),
      displayName: z.string().optional(),
      imageFile: z.string().optional(),
      imageUrl: z.string().optional(),
      sourceItemId: z.number().int().optional(),
      role: z.string().optional(),
    }),
  ),
  reports: z.object({
    difficultyReport: z.string(),
    validationReport: z.string(),
    anomalyReport: z.string().optional(),
  }),
  tables: z.object({
    itemCatalog: z.string().optional(),
    generatedItemSets: z.string().optional(),
    levelSummary: z.string().optional(),
  }),
  formula: z
    .object({
      presetId: z.string().optional(),
      name: z.string().optional(),
      file: z.string().optional(),
    })
    .optional(),
  playtest: z
    .object({
      avgPassRate: z.number(),
      needsReviewCount: z.number().int(),
      criticalIssueCount: z.number().int(),
      reportFile: z.string(),
    })
    .optional(),
  analytics: z
    .object({
      batchId: z.string(),
      avgPassRate: z.number().optional(),
      highSeverityCount: z.number().int(),
      formulaMismatchCount: z.number().int(),
      playtestMismatchCount: z.number().int(),
      reportFile: z.string(),
    })
    .optional(),
  compatibility: z.object({
    levelConfigSchemaVersion: z.number().int(),
    supportsUnityPreviewExport: z.boolean(),
    supportsLvlPreviewExport: z.boolean(),
    realLvlBinaryExport: z.literal(false),
  }),
});

export const buildPackageInputSchema = z.object({
  name: z.string().min(1),
  version: z.string().min(1),
  description: z.string().optional(),
  levelIds: z.array(z.string()).min(1),
  assetBatchIds: z.array(z.string()).optional(),
  formulaPresetId: z.string().optional(),
  includeOnlyUsedAssets: z.boolean(),
  includeReports: z.boolean(),
  includeExcelTables: z.boolean(),
  includeAdapterPreviews: z.boolean(),
  dryRun: z.boolean().optional(),
});

export const importLevelJsonSchema = z.object({
  fileContent: z.string().min(1),
  dryRun: z.boolean(),
});

export const importedLevelPayloadSchema = z.union([
  z.object({
    schemaVersion: z.literal(1),
    type: z.literal("match3d_level_config"),
    level: levelConfigSchema,
  }),
  levelConfigSchema,
]);

export const formulaPresetImportSchema = z.union([
  z.object({
    schemaVersion: z.literal(1),
    type: z.literal("formula_preset"),
    preset: z.object({
      name: z.string(),
      description: z.string().optional(),
      configJson: z.string(),
    }),
  }),
  z.object({
    name: z.string(),
    description: z.string().optional(),
    configJson: z.string(),
  }),
]);
