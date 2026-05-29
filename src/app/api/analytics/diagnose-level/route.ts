import { NextResponse } from "next/server";

import { defaultFormulaConfig } from "@/lib/difficulty/defaultFormulaConfig";
import { diagnoseLevelDifficulty } from "@/lib/difficulty/diagnoseLevelDifficulty";
import { feedbackDiagnosis } from "@/lib/analytics/feedbackDiagnosis";
import { prisma } from "@/lib/prisma";
import { levelConfigSchema } from "@/lib/validators/level";
import { diagnoseLevelSchema } from "@/lib/validators/analytics";
import type { PlaytestLevelSimulationResult } from "@/types/playtest";
import type { StandardLevelAnalyticsRow } from "@/types/analytics";

export async function POST(request: Request) {
  try {
    const payload = diagnoseLevelSchema.parse(await request.json());
    const levelRow = await prisma.generatedLevel.findUnique({ where: { id: payload.levelId } });
    if (!levelRow) return NextResponse.json({ success: false, error: "关卡不存在" }, { status: 404 });

    const analyticsRow = await prisma.levelAnalyticsRow.findFirst({
      where: {
        ...(payload.analyticsBatchId ? { batchId: payload.analyticsBatchId } : {}),
        OR: [{ levelId: levelRow.id }, { levelIndex: levelRow.levelIndex ?? undefined }, { levelName: levelRow.name }],
      },
      orderBy: { createdAt: "desc" },
    });
    if (!analyticsRow) return NextResponse.json({ success: false, error: "未找到该关卡的真实数据" }, { status: 404 });

    const formula = payload.formulaPresetId
      ? await prisma.formulaPreset.findUnique({ where: { id: payload.formulaPresetId } })
      : await prisma.formulaPreset.findFirst({ where: { isDefault: true } });
    const formulaConfig = formula?.configJson ? JSON.parse(formula.configJson) : defaultFormulaConfig;

    let formulaDiagnosis;
    try {
      const level = levelConfigSchema.parse(JSON.parse(levelRow.levelJson));
      formulaDiagnosis = diagnoseLevelDifficulty({ level, formulaConfig });
    } catch {
      formulaDiagnosis = undefined;
    }

    let playtestResult: PlaytestLevelSimulationResult | undefined;
    if (payload.includePlaytest) {
      const pt = await prisma.playtestLevelResult.findFirst({ where: { levelId: levelRow.id }, orderBy: { createdAt: "desc" } });
      if (pt?.simulationJson) playtestResult = JSON.parse(pt.simulationJson) as PlaytestLevelSimulationResult;
    }

    const analytics: StandardLevelAnalyticsRow = {
      levelId: analyticsRow.levelId ?? levelRow.id,
      levelIndex: analyticsRow.levelIndex ?? undefined,
      levelName: analyticsRow.levelName ?? levelRow.name,
      users: analyticsRow.users ?? undefined,
      starts: analyticsRow.starts ?? undefined,
      completes: analyticsRow.completes ?? undefined,
      fails: analyticsRow.fails ?? undefined,
      quits: analyticsRow.quits ?? undefined,
      retries: analyticsRow.retries ?? undefined,
      passRate: analyticsRow.passRate ?? undefined,
      failRate: analyticsRow.failRate ?? undefined,
      quitRate: analyticsRow.quitRate ?? undefined,
      retryRate: analyticsRow.retryRate ?? undefined,
      avgDurationSec: analyticsRow.avgDurationSec ?? undefined,
      avgRemainingTimeSec: analyticsRow.avgRemainingTimeSec ?? undefined,
      avgMoves: analyticsRow.avgMoves ?? undefined,
      avgBoostersUsed: analyticsRow.avgBoostersUsed ?? undefined,
      avgHintsUsed: analyticsRow.avgHintsUsed ?? undefined,
      avgShuffleUsed: analyticsRow.avgShuffleUsed ?? undefined,
    };

    const diagnosis = feedbackDiagnosis({ analytics, formulaDiagnosis, playtestResult });
    const saved = await prisma.levelFeedbackDiagnosis.create({
      data: {
        levelId: levelRow.id,
        levelIndex: diagnosis.levelIndex,
        levelName: diagnosis.levelName ?? levelRow.name,
        analyticsBatchId: analyticsRow.batchId,
        formulaPresetId: formula?.id,
        resultJson: JSON.stringify(diagnosis),
        status: diagnosis.severity === "critical" || diagnosis.severity === "high" ? "needs_review" : "completed",
      },
    });
    return NextResponse.json({ success: true, data: { diagnosisId: saved.id, diagnosis } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "诊断失败" }, { status: 400 });
  }
}
