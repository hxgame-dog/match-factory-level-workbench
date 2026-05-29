import { NextResponse } from "next/server";

import { generatorRulePresets, refreshRulePresets } from "@/lib/level/rulePresets";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ levelId: string }> };

export async function GET(_: Request, { params }: Params) {
  try {
    const { levelId } = await params;
    const levelRow = await prisma.generatedLevel.findUnique({ where: { id: levelId } });
    if (!levelRow) {
      return NextResponse.json({ success: false, error: "关卡不存在" }, { status: 404 });
    }
    const level = JSON.parse(levelRow.levelJson) as { source?: { itemSetId?: string; assetBatchId?: string } };
    const itemSetId = level.source?.itemSetId ?? levelRow.itemSetId;
    const itemSet = await prisma.generatedItemSet.findUnique({
      where: { id: itemSetId },
      include: { items: true },
    });
    const assetBatchId = level.source?.assetBatchId ?? levelRow.assetBatchId ?? undefined;
    const assets = assetBatchId
      ? await prisma.generatedAsset.findMany({ where: { batchId: assetBatchId } })
      : [];

    return NextResponse.json({
      success: true,
      data: {
        levelRow,
        level: JSON.parse(levelRow.levelJson),
        sourceItems: itemSet?.items ?? [],
        assets,
        rulePresets: {
          generatorRules: generatorRulePresets,
          refreshRules: refreshRulePresets,
        },
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "加载编辑上下文失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
