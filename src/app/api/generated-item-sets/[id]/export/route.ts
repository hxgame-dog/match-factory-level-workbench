import { NextResponse } from "next/server";

import {
  createGeneratedItemSetExcelResponse,
  parseRiskTagsJson,
} from "@/lib/generatedItemSetExport";
import {
  normalizeGeneratedItemsForExport,
  parseStoredGenerationConfig,
} from "@/lib/generatedItemSetPayload";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export const runtime = "nodejs";

export async function POST(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    const set = await prisma.generatedItemSet.findUnique({
      where: { id },
      include: { items: { orderBy: { createdAt: "asc" } } },
    });
    if (!set) {
      return NextResponse.json({ success: false, error: "未找到记录" }, { status: 404 });
    }

    const cfg = parseStoredGenerationConfig(set.constraints);
    const items = normalizeGeneratedItemsForExport(
      set.items.map((item, index) => ({
        itemId: index + 1,
        sourceItemId: item.sourceItemId ?? undefined,
        catalogItemId: item.catalogItemId ?? undefined,
        name: item.name,
        displayName: item.displayName ?? undefined,
        category1: item.category1,
        category2: item.category2 ?? undefined,
        color1: item.color1 ?? undefined,
        color2: item.color2 ?? undefined,
        shape: item.shape ?? undefined,
        size: item.size ?? undefined,
        pattern: item.pattern ?? undefined,
        targetScale: item.targetScale ?? undefined,
        moveSpeed: item.moveSpeed ?? 3,
        role: item.role as "target" | "distractor" | "filler" | "special",
        count: item.count,
        isNew: item.isNew,
        imagePrompt: item.imagePrompt ?? "",
        reason: item.reason ?? "",
        riskTags: parseRiskTagsJson(item.riskTagsJson),
      })),
    );

    let warnings: string[] = [];
    if (set.warningsJson) {
      try {
        const parsed = JSON.parse(set.warningsJson) as unknown;
        warnings = Array.isArray(parsed) ? parsed.map(String) : [];
      } catch {
        warnings = [];
      }
    }

    return createGeneratedItemSetExcelResponse(
      {
        name: set.name,
        description: set.theme,
        itemTypeCount: cfg.itemTypeCount,
        colorCount: cfg.colorCount,
        categories: cfg.categories,
        summary: set.summary ?? undefined,
        warnings,
        items,
      },
      set.name,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "导出失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
