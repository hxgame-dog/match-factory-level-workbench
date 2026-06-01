import { Suspense } from "react";

import { AssetStudioPage } from "@/components/assets/AssetStudioPage";
import { zh } from "@/lib/i18n/zh";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/AppShell";
import { PageContent } from "@/components/layout/PageContent";
import { WorkspaceRouteHydrator } from "@/components/shell/WorkspaceRouteHydrator";
import { WorkspaceShell } from "@/components/shell/WorkspaceShell";
import { getAiStatus } from "@/lib/ai/gemini";
import { prisma } from "@/lib/prisma";

export default async function AssetStudio() {
  const [itemSets, batches, aiStatus] = await Promise.all([
    prisma.generatedItemSet.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { items: { select: { id: true } } },
    }),
    prisma.assetGenerationBatch.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    getAiStatus(),
  ]);

  return (
    <AppShell>
      <AppHeader title={zh.pages.assetStudio.title} description={zh.pages.assetStudio.description} fluid />
      <PageContent fluid>
        <Suspense fallback={null}>
          <WorkspaceRouteHydrator />
        </Suspense>
        <WorkspaceShell step="assets">
          <AssetStudioPage
            itemSets={itemSets.map((set) => ({
              id: set.id,
              name: set.name,
              theme: set.theme,
              itemCount: set.items.length,
              createdAt: set.createdAt.toISOString(),
            }))}
            batches={batches.map((batch) => ({
              id: batch.id,
              name: batch.name,
              itemSetName: batch.itemSetName,
              totalCount: batch.totalCount,
              successCount: batch.successCount,
              failedCount: batch.failedCount,
              status: batch.status,
              createdAt: batch.createdAt.toISOString(),
            }))}
            imageModel={aiStatus.imageModel}
            imageGenerationReady={Boolean(aiStatus.imageGenerationReady)}
          />
        </WorkspaceShell>
      </PageContent>
    </AppShell>
  );
}
