import { AssetStudioPage } from "@/components/assets/AssetStudioPage";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/AppShell";
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
      <AppHeader title="Asset Studio" description="从 Generated Item Set 生成资源 Prompt 与图片资源，并导出资源包。" />
      <div className="p-6">
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
          mockMode={aiStatus.mockMode}
          hasGeminiKey={aiStatus.hasGeminiKey}
          imageGenerationReady={Boolean(aiStatus.imageGenerationReady)}
        />
      </div>
    </AppShell>
  );
}
