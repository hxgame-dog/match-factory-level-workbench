import { AppHeader } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/AppShell";
import { ItemCatalogClient } from "@/components/items/ItemCatalogClient";
import { zh } from "@/lib/i18n/zh";
import { prisma } from "@/lib/prisma";

export default async function ItemsPage() {
  const [initialRows, initialTotal, categoryList, colorList, sizeList] =
    await Promise.all([
      prisma.itemCatalog.findMany({
        skip: 0,
        take: 20,
        orderBy: { createdAt: "desc" },
      }),
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
    ]);

  return (
    <AppShell>
      <AppHeader title={zh.pages.items.title} description={zh.pages.items.description} />
      <div className="p-6">
        <ItemCatalogClient
          initialRows={initialRows.map((row) => ({
            ...row,
            createdAt: row.createdAt.toISOString(),
            updatedAt: row.updatedAt.toISOString(),
          }))}
          initialTotal={initialTotal}
          initialFilters={{
            category1: categoryList.map((x) => x.category1),
            color1: colorList
              .map((x) => x.color1)
              .filter((v): v is string => Boolean(v)),
            size: sizeList.map((x) => x.size).filter((v): v is string => Boolean(v)),
          }}
        />
      </div>
    </AppShell>
  );
}
