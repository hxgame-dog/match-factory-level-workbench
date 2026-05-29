import { LevelGeneratorPage } from "@/components/levels/LevelGeneratorPage";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/AppShell";
import { generatorRulePresets, refreshRulePresets } from "@/lib/level/rulePresets";
import { prisma } from "@/lib/prisma";

export default async function LevelGenerator() {
  const [itemSets, batches, history] = await Promise.all([
    prisma.generatedItemSet.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { items: { select: { id: true } } },
    }),
    prisma.assetGenerationBatch.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.generatedLevel.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  return (
    <AppShell>
      <AppHeader title="Level Generator" description="基于 ItemSet 与资源批次生成标准 LevelConfig JSON 候选关卡。" />
      <div className="p-6">
        <LevelGeneratorPage
          itemSets={itemSets.map((set) => ({
            id: set.id,
            name: set.name,
            theme: set.theme,
            itemCount: set.items.length,
          }))}
          batches={batches.map((batch) => ({
            id: batch.id,
            name: batch.name,
            itemSetId: batch.itemSetId,
            successCount: batch.successCount,
            totalCount: batch.totalCount,
          }))}
          history={history.map((row) => ({
            id: row.id,
            name: row.name,
            levelIndex: row.levelIndex,
            theme: row.theme,
            targetDifficulty: row.targetDifficulty,
            createdAt: row.createdAt.toISOString(),
          }))}
          generatorRules={generatorRulePresets}
          refreshRules={refreshRulePresets}
        />
      </div>
    </AppShell>
  );
}
