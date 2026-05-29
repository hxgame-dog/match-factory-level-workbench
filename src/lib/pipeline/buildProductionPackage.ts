import { prisma } from "@/lib/prisma";
import { diagnoseLevelDifficulty } from "@/lib/difficulty/diagnoseLevelDifficulty";
import { defaultFormulaConfig } from "@/lib/difficulty/defaultFormulaConfig";
import { buildManifest } from "@/lib/pipeline/buildManifest";
import { exportProductionZip } from "@/lib/pipeline/exportProductionZip";
import { validateProductionPackage } from "@/lib/pipeline/validateProductionPackage";
import { levelConfigSchema } from "@/lib/validators/level";
import type { ProductionManifest } from "@/types/pipeline";
import type { LevelConfig } from "@/types/level";

export async function buildProductionPackage(input: {
  name: string;
  version: string;
  description?: string;
  levelIds: string[];
  assetBatchIds?: string[];
  formulaPresetId?: string;
  includeOnlyUsedAssets: boolean;
  includeReports: boolean;
  includeExcelTables: boolean;
  includeAdapterPreviews: boolean;
  dryRun?: boolean;
}): Promise<{
  packageRecord?: { id: string; status: string };
  manifest: ProductionManifest;
  validation: ReturnType<typeof validateProductionPackage>;
  files?: Array<{ path: string; type: string; size?: number }>;
}> {
  const levelsRows = await prisma.generatedLevel.findMany({ where: { id: { in: input.levelIds } }, orderBy: [{ levelIndex: "asc" }, { createdAt: "asc" }] });
  const levels = levelsRows.map((row) => levelConfigSchema.parse(JSON.parse(row.levelJson)));
  const formula = input.formulaPresetId ? await prisma.formulaPreset.findUnique({ where: { id: input.formulaPresetId } }) : await prisma.formulaPreset.findFirst({ where: { isDefault: true } });
  const formulaConfig = formula?.configJson ? JSON.parse(formula.configJson) : defaultFormulaConfig;
  const allAssetRows = await prisma.generatedAsset.findMany({
    where: input.assetBatchIds?.length ? { batchId: { in: input.assetBatchIds } } : undefined,
    orderBy: { createdAt: "desc" },
  });
  const usedNames = new Set(levels.flatMap((l) => l.spawns.map((s) => s.name)));
  const assets = input.includeOnlyUsedAssets ? allAssetRows.filter((a) => usedNames.has(a.name)) : allAssetRows;
  const validation = validateProductionPackage({ levels, assets, formulaPreset: formula ? { id: formula.id, name: formula.name } : null });
  const diagnoses = new Map(levels.map((level) => [level.levelId, diagnoseLevelDifficulty({ level, formulaConfig })]));
  const playtestRows = await prisma.playtestLevelResult.findMany({
    where: { levelId: { in: input.levelIds } },
    orderBy: { createdAt: "desc" },
  });
  const latestByLevel = new Map<string, typeof playtestRows[number]>();
  playtestRows.forEach((r) => {
    if (!latestByLevel.has(r.levelId)) latestByLevel.set(r.levelId, r);
  });
  const latest = [...latestByLevel.values()];
  const playtest = latest.length
    ? {
        avgPassRate: latest.reduce((s, r) => s + (r.passRate ?? 0), 0) / latest.length,
        needsReviewCount: latest.filter((r) => r.status === "needs_review").length,
        criticalIssueCount: latest.reduce((sum, r) => {
          const issues = r.qaIssuesJson ? (JSON.parse(r.qaIssuesJson) as Array<{ severity?: string }>) : [];
          return sum + issues.filter((i) => i.severity === "critical").length;
        }, 0),
      }
    : null;
  const feedbackRows = await prisma.levelFeedbackDiagnosis.findMany({
    where: { levelId: { in: input.levelIds } },
    orderBy: { createdAt: "desc" },
  });
  const latestFeedbackByLevel = new Map<string, (typeof feedbackRows)[number]>();
  feedbackRows.forEach((r) => {
    if (r.levelId && !latestFeedbackByLevel.has(r.levelId)) latestFeedbackByLevel.set(r.levelId, r);
  });
  const feedbackList = [...latestFeedbackByLevel.values()];
  const parsedFeedback = feedbackList.map((r) => JSON.parse(r.resultJson) as import("@/types/analytics").LevelFeedbackDiagnosisResult);
  const analyticsPassRates = parsedFeedback.map((d) => d.analytics.passRate).filter((v): v is number => typeof v === "number");
  const analytics = feedbackList.length
    ? {
        batchId: feedbackList[0].analyticsBatchId ?? "",
        avgPassRate: analyticsPassRates.length ? analyticsPassRates.reduce((a, b) => a + b, 0) / analyticsPassRates.length : undefined,
        highSeverityCount: parsedFeedback.filter((d) => d.severity === "high" || d.severity === "critical").length,
        formulaMismatchCount: parsedFeedback.filter((d) => d.issueTags.includes("formula_underestimates") || d.issueTags.includes("formula_overestimates")).length,
        playtestMismatchCount: parsedFeedback.filter((d) => d.issueTags.includes("playtest_underestimates") || d.issueTags.includes("playtest_overestimates")).length,
      }
    : null;
  const manifest = buildManifest({
    name: input.name,
    version: input.version,
    levels,
    diagnoses,
    validation,
    assets,
    formula: formula ? { id: formula.id, name: formula.name } : null,
    playtest,
    analytics,
  });
  if (input.dryRun) {
    return {
      manifest,
      validation,
      files: [
        { path: "manifest.json", type: "json" },
        ...levels.map((_, i) => ({ path: `levels/level_${String(i + 1).padStart(3, "0")}.json`, type: "json" })),
      ],
    };
  }
  const exportJob = await prisma.exportJob.create({
    data: {
      type: "production_package_zip",
      status: "running",
      name: `${input.name}-${input.version}`,
      configJson: JSON.stringify(input),
    },
  });
  try {
    const zip = await exportProductionZip({
      manifest,
      levels: levels as LevelConfig[],
      validation,
      assets,
      formulaJson: formula?.configJson,
      includeAdapterPreviews: input.includeAdapterPreviews,
      playtestReport: latest.map((r) => (r.simulationJson ? JSON.parse(r.simulationJson) : null)),
      analyticsReport: parsedFeedback.length ? parsedFeedback : undefined,
      optimizationProposals: feedbackList.length
        ? (await prisma.levelOptimizationProposal.findMany({ where: { levelId: { in: input.levelIds } }, orderBy: { createdAt: "desc" }, take: 100 })).map((p) => ({
            levelIndex: p.levelIndex,
            levelName: p.levelName,
            proposalName: p.proposalName,
            status: p.status,
          }))
        : undefined,
    });
    const pkg = await prisma.productionPackage.create({
      data: {
        name: input.name,
        description: input.description,
        version: input.version,
        status: validation.status === "invalid" ? "needs_review" : "exported",
        levelIdsJson: JSON.stringify(input.levelIds),
        assetBatchIdsJson: JSON.stringify(input.assetBatchIds ?? []),
        formulaPresetId: formula?.id,
        manifestJson: JSON.stringify(manifest),
        validationJson: JSON.stringify(validation),
        exportPath: zip.filePath,
      },
    });
    await prisma.exportJob.update({
      where: { id: exportJob.id },
      data: { status: "completed", filePath: zip.filePath, resultJson: JSON.stringify({ manifest }) },
    });
    return {
      packageRecord: { id: pkg.id, status: pkg.status },
      manifest,
      validation,
      files: [{ path: zip.filePath, type: "zip" }],
    };
  } catch (error) {
    await prisma.exportJob.update({
      where: { id: exportJob.id },
      data: { status: "failed", error: error instanceof Error ? error.message : "构建失败" },
    });
    throw error;
  }
}
