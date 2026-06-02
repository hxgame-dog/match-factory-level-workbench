import { NextResponse } from "next/server";

import { toDbGeneratedItemSetFields } from "@/lib/generatedItemSetPayload";
import { prisma } from "@/lib/prisma";
import { generatedItemSetPayloadSchema } from "@/lib/validators/ai";

type Params = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    const set = await prisma.generatedItemSet.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!set) {
      return NextResponse.json({ success: false, error: "未找到记录" }, { status: 404 });
    }
    return NextResponse.json({
      success: true,
      data: {
        ...set,
        warnings: set.warningsJson ? JSON.parse(set.warningsJson) : [],
        items: set.items.map((item) => ({
          ...item,
          riskTags: item.riskTagsJson ? JSON.parse(item.riskTagsJson) : [],
        })),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "查询失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const payload = generatedItemSetPayloadSchema.parse(body);
    const dbFields = toDbGeneratedItemSetFields(payload);
    const updated = await prisma.$transaction(async (tx) => {
      await tx.generatedItem.deleteMany({ where: { setId: id } });
      return tx.generatedItemSet.update({
        where: { id },
        data: {
          ...dbFields,
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
              pattern: item.pattern,
              targetScale: item.targetScale,
              moveSpeed: item.moveSpeed,
              role: item.role ?? "target",
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
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "更新失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    await prisma.generatedItemSet.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "删除失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
