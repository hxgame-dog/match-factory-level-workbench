import { prisma } from "@/lib/prisma";
import type { WorkspaceProgress, WorkspaceSummary } from "@/types/workspace";

function buildProgress(
  itemCount: number,
  assetSuccessCount: number,
  levelCount: number,
): WorkspaceProgress {
  return {
    itemCount,
    assetSuccessCount,
    levelCount,
    itemsReady: itemCount > 0,
    assetsReady: assetSuccessCount > 0,
    levelsReady: levelCount > 0,
  };
}

/** 以 GeneratedItemSet 作为工作区，聚合资源批次与关卡进度 */
export async function getWorkspaceSummaries(limit = 12): Promise<WorkspaceSummary[]> {
  const sets = await prisma.generatedItemSet.findMany({
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: { _count: { select: { items: true } } },
  });

  if (sets.length === 0) return [];

  const setIds = sets.map((s) => s.id);

  const [batchAgg, levelAgg] = await Promise.all([
    prisma.assetGenerationBatch.groupBy({
      by: ["itemSetId"],
      where: { itemSetId: { in: setIds } },
      _sum: { successCount: true },
    }),
    prisma.generatedLevel.groupBy({
      by: ["itemSetId"],
      where: { itemSetId: { in: setIds } },
      _count: { _all: true },
    }),
  ]);

  const assetBySet = new Map(batchAgg.map((b) => [b.itemSetId, b._sum.successCount ?? 0]));
  const levelBySet = new Map(levelAgg.map((l) => [l.itemSetId, l._count._all]));

  return sets.map((set) => ({
    id: set.id,
    name: set.name,
    theme: set.theme,
    itemCount: set._count.items,
    updatedAt: set.updatedAt.toISOString(),
    progress: buildProgress(
      set._count.items,
      assetBySet.get(set.id) ?? 0,
      levelBySet.get(set.id) ?? 0,
    ),
  }));
}
