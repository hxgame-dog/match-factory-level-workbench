import { ItemGeneratorForm } from "@/components/generator/ItemGeneratorForm";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export default async function ItemGeneratorPage() {
  const [rows, historyRows] = await Promise.all([
    prisma.itemCatalog.findMany({ orderBy: { updatedAt: "desc" } }),
    prisma.generatedItemSet.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { items: { select: { id: true } } },
    }),
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
      <AppHeader
        title="Item Generator"
        description="第一版使用 Mock 数据生成，后续接入真实 Gemini 生成链路。"
      />
      <div className="p-6">
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">AI 道具表生成</CardTitle>
          </CardHeader>
          <CardContent>
            <ItemGeneratorForm
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
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
