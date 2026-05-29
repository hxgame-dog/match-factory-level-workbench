import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { levelConfigSchema } from "@/lib/validators/level";

const payloadSchema = z.object({
  level: levelConfigSchema,
});

type Params = { params: Promise<{ levelId: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const { levelId } = await params;
    const body = await request.json();
    const payload = payloadSchema.parse(body);
    const base = await prisma.generatedLevel.findUnique({ where: { id: levelId } });
    if (!base) {
      return NextResponse.json({ success: false, error: "原关卡不存在" }, { status: 404 });
    }
    const created = await prisma.generatedLevel.create({
      data: {
        name: `${payload.level.name} Copy`,
        levelIndex: payload.level.levelIndex,
        theme: payload.level.theme,
        itemSetId: payload.level.source.itemSetId,
        itemSetName: base.itemSetName,
        assetBatchId: payload.level.source.assetBatchId,
        assetBatchName: base.assetBatchName,
        timeLimitSec: payload.level.rules.timeLimitSec,
        slotCount: payload.level.rules.slotCount,
        boardWidth: payload.level.board.width,
        boardHeight: payload.level.board.height,
        layerCount: payload.level.board.layerCount,
        targetDifficulty: payload.level.rules.targetDifficulty,
        generatorRuleId: payload.level.rules.generatorRuleId,
        refreshRuleId: payload.level.rules.refreshRuleId,
        levelJson: JSON.stringify(payload.level),
        summary: base.summary,
        status: "draft",
      },
    });
    return NextResponse.json({ success: true, data: created });
  } catch (error) {
    const message = error instanceof Error ? error.message : "保存副本失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
