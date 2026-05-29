import { NextResponse } from "next/server";

import { diagnoseLevelDifficulty } from "@/lib/difficulty/diagnoseLevelDifficulty";
import { defaultFormulaConfig } from "@/lib/difficulty/defaultFormulaConfig";
import { getDefaultFormulaPreset } from "@/lib/difficulty/formulaPresetService";
import { prisma } from "@/lib/prisma";
import { diagnoseRequestSchema, difficultyFormulaConfigSchema } from "@/lib/validators/difficulty";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = diagnoseRequestSchema.parse(body);
    let level = input.level;
    let levelRow: { id: string; name: string; levelJson: string } | null = null;
    if (!level && input.levelId) {
      levelRow = await prisma.generatedLevel.findUnique({ where: { id: input.levelId } });
      if (!levelRow) return NextResponse.json({ success: false, error: "关卡不存在" }, { status: 404 });
      level = JSON.parse(levelRow.levelJson);
    }
    if (!level) return NextResponse.json({ success: false, error: "缺少 level 或 levelId" }, { status: 400 });

    const preset = input.formulaPresetId
      ? await prisma.formulaPreset.findUnique({ where: { id: input.formulaPresetId } })
      : await getDefaultFormulaPreset();
    const formulaConfig = input.formulaConfig
      ? difficultyFormulaConfigSchema.parse(input.formulaConfig)
      : preset
        ? difficultyFormulaConfigSchema.parse(JSON.parse(preset.configJson))
        : defaultFormulaConfig;
    const diagnosis = diagnoseLevelDifficulty({ level, formulaConfig });

    if (input.levelId && levelRow) {
      const merged = {
        ...level,
        diagnostics: {
          ...(level.diagnostics ?? {}),
          estimatedItemComplexity: diagnosis.score.M,
          estimatedRuleDifficulty: diagnosis.score.D,
          estimatedTimePressure: diagnosis.score.T,
          estimatedFinalDifficulty: diagnosis.score.P,
          warnings: diagnosis.warnings,
          suggestions: diagnosis.suggestions,
        },
      };
      await prisma.generatedLevel.update({
        where: { id: input.levelId },
        data: {
          levelJson: JSON.stringify(merged),
          warningsJson: JSON.stringify(diagnosis.warnings),
        },
      });
    }

    if (input.saveRun) {
      await prisma.difficultyDiagnosisRun.create({
        data: {
          levelId: input.levelId,
          levelName: diagnosis.levelName,
          formulaPresetId: input.formulaPresetId ?? preset?.id,
          formulaName: preset?.name,
          resultJson: JSON.stringify(diagnosis),
        },
      });
    }
    return NextResponse.json({ success: true, data: diagnosis });
  } catch (error) {
    const message = error instanceof Error ? error.message : "诊断失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
