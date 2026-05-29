import { GeminiStatusCompact } from "@/components/ai/GeminiStatusCompact";
import { ItemGeneratorForm } from "@/components/generator/ItemGeneratorForm";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/AppShell";
import { PageContent } from "@/components/layout/PageContent";
import { getAiStatus } from "@/lib/ai/gemini";
import { zh } from "@/lib/i18n/zh";
import { prisma } from "@/lib/prisma";

export default async function ItemGeneratorPage() {
  const [historyRows, aiStatus] = await Promise.all([
    prisma.generatedItemSet.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { items: { select: { id: true } } },
    }),
    getAiStatus(),
  ]);

  return (
    <AppShell>
      <AppHeader title={zh.pages.itemGenerator.title} description={zh.pages.itemGenerator.description} />
      <PageContent className="space-y-4">
        <GeminiStatusCompact
          mode="text"
          textModel={aiStatus.textModel}
          available={aiStatus.hasGeminiKey && !aiStatus.mockMode}
        />
        <ItemGeneratorForm
          initialHistory={historyRows.map((set) => ({
            id: set.id,
            name: set.name,
            theme: set.theme,
            itemCount: set.items.length,
            createdAt: set.createdAt.toISOString(),
          }))}
        />
      </PageContent>
    </AppShell>
  );
}
