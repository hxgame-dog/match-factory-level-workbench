import { NextResponse } from "next/server";

import { buildGeneratedItemSetWorkbook } from "@/lib/generatedItemSetExport";
import { parseStoredGenerationConfig } from "@/lib/generatedItemSetPayload";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

function cleanName(name: string) {
  return name.replace(/[^\w\u4e00-\u9fa5-]/g, "_");
}

export async function POST(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    const set = await prisma.generatedItemSet.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!set) {
      return NextResponse.json({ success: false, error: "未找到记录" }, { status: 404 });
    }

    const cfg = parseStoredGenerationConfig(set.constraints);
    const workbook = buildGeneratedItemSetWorkbook({
      name: set.name,
      description: set.theme,
      itemTypeCount: cfg.itemTypeCount,
      colorCount: cfg.colorCount,
      categories: cfg.categories,
      summary: set.summary ?? undefined,
      warnings: set.warningsJson ? JSON.parse(set.warningsJson) : [],
      items: set.items.map((item) => ({
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
        targetScale: item.targetScale ?? undefined,
        role: item.role as "target" | "distractor" | "filler" | "special",
        count: item.count,
        isNew: item.isNew,
        imagePrompt: item.imagePrompt ?? "",
        reason: item.reason ?? "",
        riskTags: item.riskTagsJson ? JSON.parse(item.riskTagsJson) : [],
      })),
    });

    const date = new Date().toISOString().slice(0, 10);
    const fileName = `generated_item_set_${cleanName(set.name)}_${date}.xlsx`;
    return new NextResponse(new Uint8Array(workbook), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "导出失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
