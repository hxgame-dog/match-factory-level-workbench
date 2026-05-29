import { AiStatusCard } from "@/components/ai/AiStatusCard";
import { ItemGeneratorForm } from "@/components/generator/ItemGeneratorForm";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/AppShell";
import { PageContent } from "@/components/layout/PageContent";
import { getAiStatus } from "@/lib/ai/gemini";
import { zh } from "@/lib/i18n/zh";
import { prisma } from "@/lib/prisma";

export default async function ItemGeneratorPage() {
  const [rows, historyRows, aiStatus] = await Promise.all([
    prisma.itemCatalog.findMany({ orderBy: { updatedAt: "desc" } }),
    prisma.generatedItemSet.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { items: { select: { id: true } } },
    }),
    getAiStatus(),
  ]);
  const countBy = (key: "category1" | "color1" | "size") => {
    const map = new Map<string, number>();
    rows.forEach((row) => {
      const v = row[key];
      if (!v) return;
      map.set(v, (map.get(v) ?? 0) + 1);
    });
    return [...map.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  };

  return (
    <AppShell>
      <AppHeader title={zh.pages.itemGenerator.title} description={zh.pages.itemGenerator.description} />
      <PageContent className="space-y-4">
        <AiStatusCard {...aiStatus} />
        <ItemGeneratorForm
          aiStatus={aiStatus}
          catalogContext={{
            total: rows.length,
            categories: countBy("category1"),
            colors: countBy("color1"),
            sizes: countBy("size"),
            lastImportedAt: rows[0]?.updatedAt.toISOString(),
          }}
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
