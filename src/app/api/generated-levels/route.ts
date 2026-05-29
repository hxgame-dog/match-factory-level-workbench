import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { levelConfigSchema } from "@/lib/validators/level";
import { z } from "zod";

const saveSchema = z.object({
  name: z.string().min(1),
  levelIndex: z.number().int().optional(),
  theme: z.string().optional(),
  itemSetId: z.string().min(1),
  itemSetName: z.string().min(1),
  assetBatchId: z.string().optional(),
  assetBatchName: z.string().optional(),
  targetDifficulty: z.string().optional(),
  generatorRuleId: z.string(),
  refreshRuleId: z.string(),
  summary: z.string().optional(),
  warnings: z.array(z.string()).default([]),
  validation: z.unknown().optional(),
  level: levelConfigSchema,
});

export async function GET() {
  try {
    const rows = await prisma.generatedLevel.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
    });
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : "获取历史关卡失败";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = saveSchema.parse(body);
    const validation =
      typeof payload.validation === "object" &&
      payload.validation !== null &&
      Array.isArray((payload.validation as { errors?: unknown[] }).errors) &&
      (payload.validation as { errors: unknown[] }).errors.length > 0
        ? "needs_review"
        : "validated";
    const created = await prisma.generatedLevel.create({
      data: {
        name: payload.name,
        levelIndex: payload.levelIndex,
        theme: payload.theme,
        itemSetId: payload.itemSetId,
        itemSetName: payload.itemSetName,
        assetBatchId: payload.assetBatchId,
        assetBatchName: payload.assetBatchName,
        timeLimitSec: payload.level.rules.timeLimitSec,
        slotCount: payload.level.rules.slotCount,
        boardWidth: payload.level.board.width,
        boardHeight: payload.level.board.height,
        layerCount: payload.level.board.layerCount,
        targetDifficulty: payload.targetDifficulty,
        generatorRuleId: payload.generatorRuleId,
        refreshRuleId: payload.refreshRuleId,
        levelJson: JSON.stringify(payload.level),
        summary: payload.summary,
        warningsJson: JSON.stringify(payload.warnings),
        validationJson: payload.validation ? JSON.stringify(payload.validation) : undefined,
        status: validation,
      },
    });
    return NextResponse.json({ success: true, data: created });
  } catch (error) {
    const message = error instanceof Error ? error.message : "保存关卡失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
