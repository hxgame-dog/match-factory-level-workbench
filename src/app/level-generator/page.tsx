import { LevelGeneratorPage } from "@/components/levels/LevelGeneratorPage";
import { WorkspacePageLayout } from "@/features/workspace";
import { zh } from "@/lib/i18n/zh";
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
    <WorkspacePageLayout
      title={zh.pages.levelGenerator.title}
      description={zh.pages.levelGenerator.description}
      step="levels"
    >
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
    </WorkspacePageLayout>
  );
}
