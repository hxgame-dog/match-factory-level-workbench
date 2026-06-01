import { Suspense } from "react";

import { LevelGeneratorPage } from "@/components/levels/LevelGeneratorPage";
import { zh } from "@/lib/i18n/zh";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/AppShell";
import { PageContent } from "@/components/layout/PageContent";
import { WorkspaceRouteHydrator } from "@/components/shell/WorkspaceRouteHydrator";
import { WorkspaceShell } from "@/components/shell/WorkspaceShell";
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
      <AppHeader title={zh.pages.levelGenerator.title} description={zh.pages.levelGenerator.description} fluid />
      <PageContent fluid>
        <Suspense fallback={null}>
          <WorkspaceRouteHydrator />
        </Suspense>
        <WorkspaceShell step="levels">
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
        </WorkspaceShell>
      </PageContent>
    </AppShell>
  );
}
