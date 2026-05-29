import { defaultFormulaConfig } from "@/lib/difficulty/defaultFormulaConfig";
import { diagnoseLevelDifficulty } from "@/lib/difficulty/diagnoseLevelDifficulty";
import { getDefaultFormulaPreset } from "@/lib/difficulty/formulaPresetService";
import { feedbackDiagnosis } from "@/lib/analytics/feedbackDiagnosis";
import { prisma } from "@/lib/prisma";
import { difficultyFormulaConfigSchema } from "@/lib/validators/difficulty";
import { levelConfigSchema } from "@/lib/validators/level";
import type { LevelFeedbackDiagnosisResult, StandardLevelAnalyticsRow } from "@/types/analytics";
import type { PlaytestLevelSimulationResult } from "@/types/playtest";

export type LevelAnalyticsSummary = {
  hasAnalytics: boolean;
  analyticsBatchId?: string;
  analyticsBatchName?: string;
  latestDiagnosisId?: string;
  diagnosis?: LevelFeedbackDiagnosisResult;
  analyticsRow?: StandardLevelAnalyticsRow;
};

export async function getLevelAnalyticsSummary(levelId: string): Promise<LevelAnalyticsSummary> {
  const levelRow = await prisma.generatedLevel.findUnique({ where: { id: levelId } });
  if (!levelRow) {
    return { hasAnalytics: false };
  }

  const analyticsRow = await prisma.levelAnalyticsRow.findFirst({
    where: {
      OR: [{ levelId: levelRow.id }, { levelIndex: levelRow.levelIndex ?? undefined }, { levelName: levelRow.name }],
    },
    orderBy: { createdAt: "desc" },
    include: { batch: { select: { id: true, name: true } } },
  });

  if (!analyticsRow) {
    return { hasAnalytics: false };
  }

  const latestDiagnosis = await prisma.levelFeedbackDiagnosis.findFirst({
    where: { levelId: levelRow.id },
    orderBy: { createdAt: "desc" },
  });

  if (latestDiagnosis?.resultJson) {
    return {
      hasAnalytics: true,
      analyticsBatchId: analyticsRow.batchId,
      analyticsBatchName: analyticsRow.batch.name,
      latestDiagnosisId: latestDiagnosis.id,
      diagnosis: JSON.parse(latestDiagnosis.resultJson) as LevelFeedbackDiagnosisResult,
    };
  }

  const preset = await getDefaultFormulaPreset();
  const formulaConfig = difficultyFormulaConfigSchema.parse(JSON.parse(preset.configJson));

  let formulaDiagnosis;
  try {
    const level = levelConfigSchema.parse(JSON.parse(levelRow.levelJson));
    formulaDiagnosis = diagnoseLevelDifficulty({ level, formulaConfig: formulaConfig ?? defaultFormulaConfig });
  } catch {
    formulaDiagnosis = undefined;
  }

  let playtestResult: PlaytestLevelSimulationResult | undefined;
  const pt = await prisma.playtestLevelResult.findFirst({
    where: { levelId: levelRow.id },
    orderBy: { createdAt: "desc" },
  });
  if (pt?.simulationJson) {
    playtestResult = JSON.parse(pt.simulationJson) as PlaytestLevelSimulationResult;
  }

  const analytics: StandardLevelAnalyticsRow = {
    levelId: analyticsRow.levelId ?? levelRow.id,
    levelIndex: analyticsRow.levelIndex ?? undefined,
    levelName: analyticsRow.levelName ?? levelRow.name,
    users: analyticsRow.users ?? undefined,
    starts: analyticsRow.starts ?? undefined,
    passRate: analyticsRow.passRate ?? undefined,
    failRate: analyticsRow.failRate ?? undefined,
    avgDurationSec: analyticsRow.avgDurationSec ?? undefined,
    avgRemainingTimeSec: analyticsRow.avgRemainingTimeSec ?? undefined,
    avgMoves: analyticsRow.avgMoves ?? undefined,
  };

  const diagnosis = feedbackDiagnosis({ analytics, formulaDiagnosis, playtestResult });

  return {
    hasAnalytics: true,
    analyticsBatchId: analyticsRow.batchId,
    analyticsBatchName: analyticsRow.batch.name,
    diagnosis,
    analyticsRow: analytics,
  };
}
