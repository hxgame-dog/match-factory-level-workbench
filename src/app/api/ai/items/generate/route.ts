import { NextResponse } from "next/server";

import { generateItemTable } from "@/lib/ai/gemini";
import { prisma } from "@/lib/prisma";
import { generateItemsInputSchema, generateItemsResultSchema } from "@/lib/validators/ai";

function keywordMatch(source: string, keyword: string) {
  return source.toLowerCase().includes(keyword.toLowerCase());
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const baseInput = generateItemsInputSchema.omit({ catalogSummary: true, candidateItems: true }).parse({
      ...body,
    });

    const allItems = await prisma.itemCatalog.findMany({
      orderBy: { updatedAt: "desc" },
    });
    const total = allItems.length;
    const countBy = (key: "category1" | "color1" | "size") => {
      const map = new Map<string, number>();
      for (const item of allItems) {
        const v = item[key];
        if (!v) continue;
        map.set(v, (map.get(v) ?? 0) + 1);
      }
      return [...map.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
    };

    const keywords = [baseInput.theme, ...(baseInput.constraints ? [baseInput.constraints] : [])];
    const preferred = allItems.filter((item) =>
      keywords.some((k) =>
        keywordMatch(item.name, k) ||
        keywordMatch(item.category1, k) ||
        keywordMatch(item.category2 ?? "", k),
      ),
    );
    const fallback = allItems.filter((item) => !preferred.some((p) => p.id === item.id));
    const picked = [...preferred, ...fallback].slice(0, 150);

    const input = {
      ...baseInput,
      catalogSummary: {
        total,
        categories: countBy("category1"),
        colors: countBy("color1"),
        sizes: countBy("size"),
      },
      candidateItems: picked.map((item) => ({
        id: item.id,
        itemId: item.itemId ?? undefined,
        name: item.name,
        category1: item.category1,
        category2: item.category2 ?? undefined,
        color1: item.color1 ?? undefined,
        color2: item.color2 ?? undefined,
        shape: item.shape ?? undefined,
        size: item.size ?? undefined,
        targetScale: item.targetScale ?? undefined,
      })),
    };

    const result = await generateItemTable(input);
    const validated = generateItemsResultSchema.parse(result);
    return NextResponse.json({
      success: true,
      data: validated,
      context: {
        catalogSummary: input.catalogSummary,
        candidateCount: input.candidateItems.length,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "AI 道具生成请求失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
