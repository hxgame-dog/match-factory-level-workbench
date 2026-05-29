import { NextResponse } from "next/server";
import { z } from "zod";

import { generateDifficultyAdvice } from "@/lib/ai/gemini";
import { prisma } from "@/lib/prisma";
import { difficultyDiagnosisResultSchema } from "@/lib/validators/difficulty";
import { levelConfigSchema } from "@/lib/validators/level";

const schema = z.object({
  levelId: z.string().optional(),
  level: levelConfigSchema.optional(),
  diagnosis: difficultyDiagnosisResultSchema,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = schema.parse(body);
    let level = input.level;
    if (!level && input.levelId) {
      const row = await prisma.generatedLevel.findUnique({ where: { id: input.levelId } });
      if (!row) return NextResponse.json({ success: false, error: "关卡不存在" }, { status: 404 });
      level = levelConfigSchema.parse(JSON.parse(row.levelJson));
    }
    if (!level) return NextResponse.json({ success: false, error: "缺少 level 或 levelId" }, { status: 400 });
    const advice = await generateDifficultyAdvice({ level, diagnosis: input.diagnosis });
    return NextResponse.json({ success: true, data: advice });
  } catch (error) {
    const message = error instanceof Error ? error.message : "生成建议失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
