import { NextResponse } from "next/server";
import { z } from "zod";

import { analyzeSourceLevels } from "@/lib/auto-level/analyzeSourceLevels";
import { generateTargetCurve } from "@/lib/auto-level/generateTargetCurve";
import { defaultFormulaConfig } from "@/lib/difficulty/defaultFormulaConfig";
import { diagnoseLevelDifficulty } from "@/lib/difficulty/diagnoseLevelDifficulty";
import { prisma } from "@/lib/prisma";
import { autoGenerateLevelsInputSchema } from "@/lib/validators/autoLevel";
import { levelConfigSchema } from "@/lib/validators/level";

const schema = z.object({
  sourceLevelIds: z.array(z.string()).min(1),
  formulaPresetId: z.string().optional(),
  generateCount: z.number().int().positive(),
  targetStartIndex: z.number().int().optional(),
  curveConfig: autoGenerateLevelsInputSchema.shape.curveConfig,
});

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());
    const rows = await prisma.generatedLevel.findMany({
      where: { id: { in: payload.sourceLevelIds } },
      orderBy: [{ levelIndex: "asc" }, { createdAt: "asc" }],
    });
    const formulaPreset = payload.formulaPresetId
      ? await prisma.formulaPreset.findUnique({ where: { id: payload.formulaPresetId } })
      : await prisma.formulaPreset.findFirst({ where: { isDefault: true } });
    const formulaConfig = formulaPreset?.configJson ? JSON.parse(formulaPreset.configJson) : defaultFormulaConfig;
    const levels = rows.map((row) => levelConfigSchema.parse(JSON.parse(row.levelJson)));
    const diagnoses = levels.map((level) => diagnoseLevelDifficulty({ level, formulaConfig }));
    const sourceAnalysis = analyzeSourceLevels({ levels, diagnoses });
    const curve = generateTargetCurve({
      sourceAnalysis,
      lastLevelIndex: payload.targetStartIndex ?? Math.max(...rows.map((r) => r.levelIndex ?? 0)),
      generateCount: payload.generateCount,
      curveConfig: payload.curveConfig,
      formulaConfig,
    });
    return NextResponse.json({ success: true, data: curve });
  } catch (error) {
    const message = error instanceof Error ? error.message : "目标曲线生成失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
