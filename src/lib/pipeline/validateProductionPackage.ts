import { validateLevelConfig } from "@/lib/level/validateLevelConfig";
import type { PackageValidationResult } from "@/types/pipeline";
import type { LevelConfig } from "@/types/level";

export function validateProductionPackage(input: {
  levels: LevelConfig[];
  assets: Array<{ name: string; imageUrl?: string | null }>;
  formulaPreset?: { id: string; name: string } | null;
}): PackageValidationResult {
  const errors: PackageValidationResult["errors"] = [];
  const warnings: PackageValidationResult["warnings"] = [];
  const indices = new Map<number, number>();
  let missingAssetCount = 0;

  for (const level of input.levels) {
    if (level.levelIndex !== undefined) {
      indices.set(level.levelIndex, (indices.get(level.levelIndex) ?? 0) + 1);
    }
    if (!level.targets.length) {
      errors.push({ code: "missing_target", message: "targets 为空", levelId: level.levelId, levelName: level.name, severity: "error" });
    }
    if (!level.spawns.length) {
      errors.push({ code: "empty_spawns", message: "spawns 为空", levelId: level.levelId, levelName: level.name, severity: "error" });
    }
    const valid = validateLevelConfig(
      level,
      level.spawns.map((s) => ({ id: s.generatedItemId ?? s.catalogItemId, name: s.name, role: s.role })),
    );
    valid.errors.forEach((msg) =>
      errors.push({ code: "invalid_level_schema", message: msg, levelId: level.levelId, levelName: level.name, severity: "error" }),
    );
    valid.warnings.forEach((msg) =>
      warnings.push({ code: "needs_review", message: msg, levelId: level.levelId, levelName: level.name, severity: "warning" }),
    );
    const missing = level.spawns.filter((s) => s.assetKey && !level.assets[s.assetKey]).length;
    missingAssetCount += missing;
    if (missing > 0) {
      warnings.push({
        code: "missing_asset",
        message: `缺失资源映射 ${missing} 个`,
        levelId: level.levelId,
        levelName: level.name,
        severity: "warning",
      });
    }
  }

  const duplicateLevelIndexCount = [...indices.values()].filter((v) => v > 1).length;
  if (duplicateLevelIndexCount > 0) {
    errors.push({
      code: "duplicate_level_index",
      message: `存在 ${duplicateLevelIndexCount} 个重复 levelIndex`,
      severity: "error",
    });
  }

  const status =
    errors.length > 0 ? "invalid" : warnings.length > 0 ? "needs_review" : "valid";
  return {
    isValid: errors.length === 0,
    status,
    summary: {
      levelCount: input.levels.length,
      assetCount: input.assets.length,
      errorCount: errors.length,
      warningCount: warnings.length,
      missingAssetCount,
      duplicateLevelIndexCount,
    },
    errors,
    warnings,
  };
}
