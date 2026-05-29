import { NextResponse } from "next/server";
import { z } from "zod";

import { difficultyDiagnosisResultSchema } from "@/lib/validators/difficulty";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  levelId: z.string().optional(),
  levelName: z.string().optional(),
  formulaPresetId: z.string().optional(),
  formulaName: z.string().optional(),
  result: difficultyDiagnosisResultSchema,
  aiAdvice: z.unknown().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = schema.parse(body);
    const row = await prisma.difficultyDiagnosisRun.create({
      data: {
        levelId: input.levelId,
        levelName: input.levelName,
        formulaPresetId: input.formulaPresetId,
        formulaName: input.formulaName,
        resultJson: JSON.stringify(input.result),
        aiAdviceJson: input.aiAdvice ? JSON.stringify(input.aiAdvice) : undefined,
      },
    });
    return NextResponse.json({ success: true, data: row });
  } catch (error) {
    const message = error instanceof Error ? error.message : "保存诊断记录失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
