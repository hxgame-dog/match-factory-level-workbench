import { NextResponse } from "next/server";

import { generateOptimizationProposal } from "@/lib/analytics/generateOptimizationProposal";
import { defaultFormulaConfig } from "@/lib/difficulty/defaultFormulaConfig";
import { diagnoseLevelDifficulty } from "@/lib/difficulty/diagnoseLevelDifficulty";
import { prisma } from "@/lib/prisma";
import { levelConfigSchema } from "@/lib/validators/level";
import { optimizationGenerateSchema } from "@/lib/validators/analytics";
import type { LevelFeedbackDiagnosisResult } from "@/types/analytics";

export async function POST(request: Request) {
  try {
    const payload = optimizationGenerateSchema.parse(await request.json());
    const levelRow = await prisma.generatedLevel.findUnique({ where: { id: payload.levelId } });
    if (!levelRow) return NextResponse.json({ success: false, error: "关卡不存在" }, { status: 404 });
    const diagnosisRow = await prisma.levelFeedbackDiagnosis.findUnique({ where: { id: payload.diagnosisId } });
    if (!diagnosisRow) return NextResponse.json({ success: false, error: "诊断不存在" }, { status: 404 });

    const level = levelConfigSchema.parse(JSON.parse(levelRow.levelJson));
    const diagnosis = JSON.parse(diagnosisRow.resultJson) as LevelFeedbackDiagnosisResult;
    const proposal = generateOptimizationProposal({ level, diagnosis, mode: payload.mode });

    const optimizedDiagnosis = diagnoseLevelDifficulty({ level: proposal.optimizedLevel, formulaConfig: defaultFormulaConfig });

    const saved = await prisma.levelOptimizationProposal.create({
      data: {
        levelId: levelRow.id,
        levelName: levelRow.name,
        levelIndex: levelRow.levelIndex,
        sourceDiagnosisId: diagnosisRow.id,
        proposalName: proposal.proposalName,
        proposalJson: JSON.stringify(proposal.optimizedLevel),
        diffJson: JSON.stringify(proposal.diff),
        aiReasonJson: JSON.stringify({ reason: proposal.reason, warnings: proposal.warnings }),
        status: "draft",
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        proposalId: saved.id,
        proposal,
        optimizedFormula: { P: optimizedDiagnosis.score.P, label: optimizedDiagnosis.score.label },
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "优化方案生成失败" }, { status: 400 });
  }
}
