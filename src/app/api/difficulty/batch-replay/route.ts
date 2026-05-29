import { NextResponse } from "next/server";
import { z } from "zod";

import { runBatchReplay } from "@/lib/difficulty/batchReplay";
import { defaultFormulaConfig } from "@/lib/difficulty/defaultFormulaConfig";
import { getDefaultFormulaPreset } from "@/lib/difficulty/formulaPresetService";
import { prisma } from "@/lib/prisma";
import { difficultyFormulaConfigSchema } from "@/lib/validators/difficulty";

const schema = z.object({
  levelIds: z.array(z.string()).optional(),
  recentCount: z.number().int().positive().optional(),
  formulaPresetId: z.string().optional(),
  formulaConfig: difficultyFormulaConfigSchema.optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = schema.parse(body);
    const levels = input.levelIds?.length
      ? await prisma.generatedLevel.findMany({ where: { id: { in: input.levelIds } }, orderBy: { levelIndex: "asc" } })
      : await prisma.generatedLevel.findMany({
          orderBy: [{ levelIndex: "asc" }, { createdAt: "desc" }],
          take: input.recentCount ?? 10,
        });
    const preset = input.formulaPresetId
      ? await prisma.formulaPreset.findUnique({ where: { id: input.formulaPresetId } })
      : await getDefaultFormulaPreset();
    const formulaConfig = input.formulaConfig
      ? difficultyFormulaConfigSchema.parse(input.formulaConfig)
      : preset
        ? difficultyFormulaConfigSchema.parse(JSON.parse(preset.configJson))
        : defaultFormulaConfig;
    const replay = runBatchReplay({
      levels: levels.map((row) => ({ id: row.id, name: row.name, level: JSON.parse(row.levelJson) })),
      formulaConfig,
    });
    return NextResponse.json({ success: true, ...replay });
  } catch (error) {
    const message = error instanceof Error ? error.message : "批量回放失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
