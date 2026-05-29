import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { generateAssetBatchInputSchema } from "@/lib/validators/asset";

export async function GET() {
  try {
    const rows = await prisma.assetGenerationBatch.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
    });
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : "获取批次失败";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = generateAssetBatchInputSchema.parse(body);
    const itemSet = await prisma.generatedItemSet.findUnique({
      where: { id: input.itemSetId },
      include: { items: true },
    });
    if (!itemSet) {
      return NextResponse.json({ success: false, error: "未找到 Item Set" }, { status: 404 });
    }
    const batch = await prisma.assetGenerationBatch.create({
      data: {
        itemSetId: itemSet.id,
        itemSetName: itemSet.name,
        name: input.batchName,
        globalArtStyle: input.globalArtStyle,
        provider: env.AI_MOCK_MODE ? "mock" : env.AI_PROVIDER,
        model: env.AI_MOCK_MODE ? "mock-svg" : env.GEMINI_IMAGE_MODEL,
        status: "pending",
        totalCount: itemSet.items.length,
      },
    });
    return NextResponse.json({ success: true, data: batch });
  } catch (error) {
    const message = error instanceof Error ? error.message : "创建批次失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
