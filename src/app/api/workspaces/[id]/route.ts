import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import type { WorkspaceProgress } from "@/types/workspace";

type Params = { params: Promise<{ id: string }> };

function buildProgress(itemCount: number, assetSuccess: number, levelCount: number): WorkspaceProgress {
  return {
    itemCount,
    assetSuccessCount: assetSuccess,
    levelCount,
    itemsReady: itemCount > 0,
    assetsReady: assetSuccess > 0,
    levelsReady: levelCount > 0,
  };
}

export async function GET(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    const set = await prisma.generatedItemSet.findUnique({
      where: { id },
      include: { _count: { select: { items: true } } },
    });
    if (!set) {
      return NextResponse.json({ success: false, error: "未找到工作区" }, { status: 404 });
    }

    const [assetSum, levelCount] = await Promise.all([
      prisma.assetGenerationBatch.aggregate({
        where: { itemSetId: id },
        _sum: { successCount: true },
      }),
      prisma.generatedLevel.count({ where: { itemSetId: id } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        id: set.id,
        name: set.name,
        theme: set.theme,
        itemCount: set._count.items,
        updatedAt: set.updatedAt.toISOString(),
        progress: buildProgress(
          set._count.items,
          assetSum._sum.successCount ?? 0,
          levelCount,
        ),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "获取工作区失败";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
