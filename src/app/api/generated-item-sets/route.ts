import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { generatedItemSetPayloadSchema } from "@/lib/validators/ai";

export async function GET() {
  try {
    const sets = await prisma.generatedItemSet.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { items: { select: { id: true } } },
    });
    return NextResponse.json({
      success: true,
      data: sets.map((set) => ({
        id: set.id,
        name: set.name,
        theme: set.theme,
        itemCount: set.items.length,
        createdAt: set.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "获取历史失败";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = generatedItemSetPayloadSchema.parse(body);
    const created = await prisma.generatedItemSet.create({
      data: {
        name: payload.name,
        theme: payload.theme,
        prompt: payload.prompt,
        totalItemCount: payload.totalItemCount,
        targetTypeCount: payload.targetTypeCount,
        targetCountEach: payload.targetCountEach,
        distractorTypeCount: payload.distractorTypeCount,
        difficultyIntent: payload.difficultyIntent,
        constraints: payload.constraints,
        summary: payload.summary,
        warningsJson: JSON.stringify(payload.warnings ?? []),
        items: {
          create: payload.items.map((item) => ({
            sourceItemId: item.sourceItemId,
            catalogItemId: item.catalogItemId,
            name: item.name,
            displayName: item.displayName,
            category1: item.category1,
            category2: item.category2,
            color1: item.color1,
            color2: item.color2,
            shape: item.shape,
            size: item.size,
            targetScale: item.targetScale,
            role: item.role,
            count: item.count,
            isNew: item.isNew,
            imagePrompt: item.imagePrompt,
            reason: item.reason,
            riskTagsJson: JSON.stringify(item.riskTags ?? []),
          })),
        },
      },
      include: { items: true },
    });
    return NextResponse.json({ success: true, data: created });
  } catch (error) {
    const message = error instanceof Error ? error.message : "保存失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
