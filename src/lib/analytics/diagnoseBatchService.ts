import { prisma } from "@/lib/prisma";
import { defaultFormulaConfig } from "@/lib/difficulty/defaultFormulaConfig";
import { diagnoseLevelDifficulty } from "@/lib/difficulty/diagnoseLevelDifficulty";
import { levelConfigSchema } from "@/lib/validators/level";
import { feedbackDiagnosis } from "./feedbackDiagnosis";
import type { LevelFeedbackDiagnosisResult, StandardLevelAnalyticsRow } from "@/types/analytics";
import type { DifficultyFormulaConfig } from "@/types/difficulty";
import type { PlaytestLevelSimulationResult } from "@/types/playtest";

type GeneratedLevelRow = Awaited<ReturnType<typeof prisma.generatedLevel.findMany>>[number];

function matchLevel(
  row: { levelId?: string | null; levelIndex?: number | null; levelName?: string | null },
  levels: GeneratedLevelRow[],
): GeneratedLevelRow | undefined {
  if (row.levelId) {
    const byId = levels.find((l) => l.id === row.levelId);
    if (byId) return byId;
  }
  if (row.levelIndex !== undefined && row.levelIndex !== null) {
    const byIndex = levels.find((l) => l.levelIndex === row.levelIndex);
    if (byIndex) return byIndex;
  }
  if (row.levelName) {
    const byName = levels.find((l) => l.name === row.levelName);
    if (byName) return byName;
  }
  return undefined;
}

export async function diagnoseBatch(input: {
  batchId: string;
  formulaPresetId?: string;
  includePlaytest?: boolean;
  saveResults?: boolean;
  writeBackToLevels?: boolean;
}): Promise<{
  results: Array<LevelFeedbackDiagnosisResult & { matched: boolean; matchedLevelId?: string }>;
  unmatchedCount: number;
}> {
  const batch = await prisma.analyticsImportBatch.findUnique({ where: { id: input.batchId }, include: { rows: true } });
  if (!batch) throw new Error("数据批次不存在");

  const formula = input.formulaPresetId
    ? await prisma.formulaPreset.findUnique({ where: { id: input.formulaPresetId } })
    : await prisma.formulaPreset.findFirst({ where: { isDefault: true } });
  const formulaConfig: DifficultyFormulaConfig = formula?.configJson ? JSON.parse(formula.configJson) : defaultFormulaConfig;

  const levels = await prisma.generatedLevel.findMany({ take: 500, orderBy: { createdAt: "desc" } });

  const results: Array<LevelFeedbackDiagnosisResult & { matched: boolean; matchedLevelId?: string }> = [];
  let unmatchedCount = 0;

  for (const row of batch.rows) {
    const analytics: StandardLevelAnalyticsRow = {
      levelId: row.levelId ?? undefined,
      levelIndex: row.levelIndex ?? undefined,
      levelName: row.levelName ?? undefined,
      users: row.users ?? undefined,
      starts: row.starts ?? undefined,
      completes: row.completes ?? undefined,
      fails: row.fails ?? undefined,
      quits: row.quits ?? undefined,
      retries: row.retries ?? undefined,
      passRate: row.passRate ?? undefined,
      failRate: row.failRate ?? undefined,
      quitRate: row.quitRate ?? undefined,
      retryRate: row.retryRate ?? undefined,
      avgDurationSec: row.avgDurationSec ?? undefined,
      avgRemainingTimeSec: row.avgRemainingTimeSec ?? undefined,
      avgMoves: row.avgMoves ?? undefined,
      avgBoostersUsed: row.avgBoostersUsed ?? undefined,
      avgHintsUsed: row.avgHintsUsed ?? undefined,
      avgShuffleUsed: row.avgShuffleUsed ?? undefined,
    };

    const matched = matchLevel(row, levels);
    let formulaDiagnosis;
    let playtestResult: PlaytestLevelSimulationResult | undefined;
    if (matched) {
      try {
        const level = levelConfigSchema.parse(JSON.parse(matched.levelJson));
        formulaDiagnosis = diagnoseLevelDifficulty({ level, formulaConfig });
      } catch {
        // 解析失败时跳过公式诊断
      }
      if (input.includePlaytest) {
        const playtestRow = await prisma.playtestLevelResult.findFirst({
          where: { levelId: matched.id },
          orderBy: { createdAt: "desc" },
        });
        if (playtestRow?.simulationJson) {
          playtestResult = JSON.parse(playtestRow.simulationJson) as PlaytestLevelSimulationResult;
        }
      }
    } else {
      unmatchedCount += 1;
    }

    const diagnosis = feedbackDiagnosis({ analytics, formulaDiagnosis, playtestResult });
    if (matched && !diagnosis.levelName) diagnosis.levelName = matched.name;

    if (input.saveResults) {
      await prisma.levelFeedbackDiagnosis.create({
        data: {
          levelId: matched?.id,
          levelIndex: diagnosis.levelIndex,
          levelName: diagnosis.levelName,
          analyticsBatchId: batch.id,
          formulaPresetId: formula?.id,
          resultJson: JSON.stringify(diagnosis),
          status: diagnosis.severity === "critical" || diagnosis.severity === "high" ? "needs_review" : "completed",
        },
      });
    }

    if (input.writeBackToLevels && matched) {
      try {
        const level = JSON.parse(matched.levelJson);
        const next = { ...level, analytics: diagnosis.analytics, feedbackSeverity: diagnosis.severity, issueTags: diagnosis.issueTags };
        await prisma.generatedLevel.update({ where: { id: matched.id }, data: { levelJson: JSON.stringify(next) } });
      } catch {
        // 写回失败不影响整体
      }
    }

    results.push({ ...diagnosis, matched: Boolean(matched), matchedLevelId: matched?.id });
  }

  return { results, unmatchedCount };
}
