import { GeminiStatusCompact } from "@/components/ai/GeminiStatusCompact";
import { ItemGeneratorWorkspace } from "@/components/generator/ItemGeneratorWorkspace";
import { WorkspacePageLayout } from "@/features/workspace";
import { getAiStatus } from "@/lib/ai/gemini";
import { zh } from "@/lib/i18n/zh";
import { prisma } from "@/lib/prisma";

export default async function ItemGeneratorPage() {
  const [historyRows, catalogRows, catalogTotal, categoryList, colorList, sizeList, aiStatus] =
    await Promise.all([
      prisma.generatedItemSet.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { items: { select: { id: true } } },
      }),
      prisma.itemCatalog.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
      prisma.itemCatalog.count(),
      prisma.itemCatalog.findMany({
        select: { category1: true },
        distinct: ["category1"],
        orderBy: { category1: "asc" },
      }),
      prisma.itemCatalog.findMany({
        where: { color1: { not: null } },
        select: { color1: true },
        distinct: ["color1"],
        orderBy: { color1: "asc" },
      }),
      prisma.itemCatalog.findMany({
        where: { size: { not: null } },
        select: { size: true },
        distinct: ["size"],
        orderBy: { size: "asc" },
      }),
      getAiStatus(),
    ]);

  return (
    <WorkspacePageLayout
      title={zh.pages.itemGenerator.title}
      description={zh.pages.itemGenerator.description}
      step="items"
      contentClassName="space-y-4"
    >
      <GeminiStatusCompact
        mode="text"
        textModel={aiStatus.textModel}
        available={aiStatus.hasGeminiKey && !aiStatus.mockMode}
      />
      <ItemGeneratorWorkspace
        initialHistory={historyRows.map((set) => ({
          id: set.id,
          name: set.name,
          theme: set.theme,
          itemCount: set.items.length,
          createdAt: set.createdAt.toISOString(),
        }))}
        initialCatalogTotal={catalogTotal}
        initialCatalogRows={catalogRows.map((row) => ({
          ...row,
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
        }))}
        initialCatalogFilters={{
          category1: categoryList.map((x) => x.category1),
          color1: colorList.map((x) => x.color1).filter((v): v is string => Boolean(v)),
          size: sizeList.map((x) => x.size).filter((v): v is string => Boolean(v)),
        }}
      />
    </WorkspacePageLayout>
  );
}
