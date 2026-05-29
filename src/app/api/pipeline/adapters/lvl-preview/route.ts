import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { levelConfigSchema } from "@/lib/validators/level";
import { buildLvlPreview } from "@/lib/pipeline/adapterPreview/lvlPreview";
import { diagnoseLevelDifficulty } from "@/lib/difficulty/diagnoseLevelDifficulty";
import { defaultFormulaConfig } from "@/lib/difficulty/defaultFormulaConfig";
import { z } from "zod";

const schema = z.object({ levelIds: z.array(z.string()).min(1) });

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());
    const rows = await prisma.generatedLevel.findMany({ where: { id: { in: payload.levelIds } } });
    const levels = rows.map((r) => levelConfigSchema.parse(JSON.parse(r.levelJson)));
    const pMap = new Map(levels.map((l) => [l.levelId, diagnoseLevelDifficulty({ level: l, formulaConfig: defaultFormulaConfig }).score.P]));
    return NextResponse.json({ success: true, data: buildLvlPreview(levels, pMap) });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "生成失败" }, { status: 400 });
  }
}
