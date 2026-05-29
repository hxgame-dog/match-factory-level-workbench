import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    const batch = await prisma.assetGenerationBatch.findUnique({
      where: { id },
      include: { assets: true },
    });
    if (!batch) {
      return NextResponse.json({ success: false, error: "批次不存在" }, { status: 404 });
    }
    return NextResponse.json({
      batchId: batch.id,
      itemSetId: batch.itemSetId,
      assets: batch.assets.map((asset) => ({
        name: asset.name,
        displayName: asset.displayName,
        sourceItemId: asset.sourceItemId,
        catalogItemId: asset.catalogItemId,
        generatedItemId: asset.generatedItemId,
        role: asset.role,
        count: asset.count,
        imageUrl: asset.imageUrl,
        fileName: asset.imageUrl?.split("/").at(-1),
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "导出 mapping 失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
