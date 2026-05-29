import { NextResponse } from "next/server";

import { createLevelSnapshot } from "@/lib/pipeline/snapshotService";
import { prisma } from "@/lib/prisma";
import { levelConfigSchema } from "@/lib/validators/level";

type Params = { params: Promise<{ id: string }> };

export async function POST(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    const proposal = await prisma.levelOptimizationProposal.findUnique({ where: { id } });
    if (!proposal) return NextResponse.json({ success: false, error: "优化方案不存在" }, { status: 404 });

    // 保存优化版关卡前，先为原始关卡创建快照
    try {
      await createLevelSnapshot(proposal.levelId, `Before optimization ${proposal.proposalName}`, "analytics optimization auto snapshot");
    } catch {
      // 若原关卡已被删除则跳过快照
    }

    const level = levelConfigSchema.parse(JSON.parse(proposal.proposalJson));
    const created = await prisma.generatedLevel.create({
      data: {
        name: proposal.proposalName,
        levelIndex: proposal.levelIndex,
        theme: level.theme,
        itemSetId: level.source.itemSetId,
        itemSetName: level.source.itemSetId,
        assetBatchId: level.source.assetBatchId,
        assetBatchName: level.source.assetBatchId,
        timeLimitSec: level.rules.timeLimitSec,
        slotCount: level.rules.slotCount,
        boardWidth: level.board.width,
        boardHeight: level.board.height,
        layerCount: level.board.layerCount,
        targetDifficulty: level.rules.targetDifficulty,
        generatorRuleId: level.rules.generatorRuleId,
        refreshRuleId: level.rules.refreshRuleId,
        levelJson: JSON.stringify(level),
        summary: "Analytics 优化版本",
        status: "needs_review",
      },
    });
    await prisma.levelOptimizationProposal.update({
      where: { id },
      data: { status: "saved_as_level", savedLevelId: created.id },
    });
    return NextResponse.json({ success: true, data: { savedLevelId: created.id } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "保存优化版失败" }, { status: 400 });
  }
}
