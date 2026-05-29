import { defaultFormulaConfig } from "@/lib/difficulty/defaultFormulaConfig";
import { diagnoseLevelDifficulty } from "@/lib/difficulty/diagnoseLevelDifficulty";
import { feedbackDiagnosis } from "@/lib/analytics/feedbackDiagnosis";
import { buildCalibrationPoints, type CalibrationPoint } from "@/lib/analytics/compareFormulaPlaytestAnalytics";
import { getDefaultFormulaPreset } from "@/lib/difficulty/formulaPresetService";
import { prisma } from "@/lib/prisma";
import { difficultyFormulaConfigSchema } from "@/lib/validators/difficulty";
import { levelConfigSchema } from "@/lib/validators/level";
import type { LevelFeedbackDiagnosisResult, StandardLevelAnalyticsRow } from "@/types/analytics";
import type { PlaytestLevelSimulationResult } from "@/types/playtest";

export type CalibrationDataset = {
  points: CalibrationPoint[];
  summary: {
    total: number;
    formulaMismatchCount: number;
    playtestMismatchCount: number;
    withActualPassRate: number;
  };
};

export async function buildCalibrationDataset(limit = 80): Promise<CalibrationDataset> {
  const preset = await getDefaultFormulaPreset();
  const formulaConfig = difficultyFormulaConfigSchema.parse(JSON.parse(preset.configJson));

  const analyticsRows = await prisma.levelAnalyticsRow.findMany({
    where: { passRate: { not: null } },
    orderBy: { createdAt: "desc" },
    take: limit * 2,
  });

  const seen = new Set<string>();
  const diagnoses: LevelFeedbackDiagnosisResult[] = [];

  for (const row of analyticsRows) {
    const key = row.levelId ?? `${row.levelIndex}_${row.levelName}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const levelRow = row.levelId
      ? await prisma.generatedLevel.findUnique({ where: { id: row.levelId } })
      : row.levelIndex != null
        ? await prisma.generatedLevel.findFirst({ where: { levelIndex: row.levelIndex } })
        : row.levelName
          ? await prisma.generatedLevel.findFirst({ where: { name: row.levelName } })
          : null;

    let formulaDiagnosis;
    if (levelRow) {
      try {
        const level = levelConfigSchema.parse(JSON.parse(levelRow.levelJson));
        formulaDiagnosis = diagnoseLevelDifficulty({ level, formulaConfig });
      } catch {
        formulaDiagnosis = undefined;
      }
    }

    let playtestResult: PlaytestLevelSimulationResult | undefined;
    if (levelRow) {
      const pt = await prisma.playtestLevelResult.findFirst({
        where: { levelId: levelRow.id },
        orderBy: { createdAt: "desc" },
      });
      if (pt?.simulationJson) playtestResult = JSON.parse(pt.simulationJson) as PlaytestLevelSimulationResult;
    }

    const analytics: StandardLevelAnalyticsRow = {
      levelId: row.levelId ?? levelRow?.id,
      levelIndex: row.levelIndex ?? undefined,
      levelName: row.levelName ?? levelRow?.name,
      passRate: row.passRate ?? undefined,
      starts: row.starts ?? undefined,
      users: row.users ?? undefined,
    };

    diagnoses.push(feedbackDiagnosis({ analytics, formulaDiagnosis, playtestResult }));
    if (diagnoses.length >= limit) break;
  }

  const points = buildCalibrationPoints(diagnoses);
  return {
    points,
    summary: {
      total: points.length,
      formulaMismatchCount: points.filter((p) => p.formulaMismatch === "high" || p.formulaMismatch === "medium").length,
      playtestMismatchCount: points.filter((p) => p.playtestMismatch === "high" || p.playtestMismatch === "medium").length,
      withActualPassRate: points.filter((p) => p.actualPassRate != null).length,
    },
  };
}

export type PlaytestAnalyticsCompareRow = {
  levelId: string;
  levelName: string;
  levelIndex?: number | null;
  playtestPassRate: number | null;
  actualPassRate: number | null;
  delta: number | null;
  mismatchLevel: "none" | "low" | "medium" | "high";
  message: string;
};

export async function buildPlaytestAnalyticsCompare(levelIds: string[]): Promise<PlaytestAnalyticsCompareRow[]> {
  const rows: PlaytestAnalyticsCompareRow[] = [];

  for (const levelId of levelIds) {
    const levelRow = await prisma.generatedLevel.findUnique({ where: { id: levelId } });
    if (!levelRow) continue;

    const pt = await prisma.playtestLevelResult.findFirst({
      where: { levelId },
      orderBy: { createdAt: "desc" },
    });
    const playtestPassRate = pt?.passRate ?? null;

    const analyticsRow = await prisma.levelAnalyticsRow.findFirst({
      where: {
        OR: [{ levelId }, { levelIndex: levelRow.levelIndex ?? undefined }, { levelName: levelRow.name }],
      },
      orderBy: { createdAt: "desc" },
    });
    const actualPassRate = analyticsRow?.passRate ?? null;

    let mismatchLevel: PlaytestAnalyticsCompareRow["mismatchLevel"] = "none";
    let message = "无真实数据或未模拟";
    if (playtestPassRate != null && actualPassRate != null) {
      const delta = Math.abs(playtestPassRate - actualPassRate);
      if (delta >= 0.25) {
        mismatchLevel = "high";
        message = playtestPassRate > actualPassRate ? "模拟偏高，可能低估难度" : "模拟偏低，可能高估难度";
      } else if (delta >= 0.12) {
        mismatchLevel = "medium";
        message = "模拟与真实存在一定偏差";
      } else {
        message = "模拟与真实基本一致";
      }
      rows.push({
        levelId,
        levelName: levelRow.name,
        levelIndex: levelRow.levelIndex,
        playtestPassRate,
        actualPassRate,
        delta,
        mismatchLevel,
        message,
      });
    } else {
      rows.push({
        levelId,
        levelName: levelRow.name,
        levelIndex: levelRow.levelIndex,
        playtestPassRate,
        actualPassRate,
        delta: null,
        mismatchLevel: "none",
        message,
      });
    }
  }

  return rows;
}
