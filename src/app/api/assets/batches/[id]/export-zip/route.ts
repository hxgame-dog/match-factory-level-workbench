import { NextResponse } from "next/server";

import { buildAssetBatchZip } from "@/lib/assets/exportZip";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function POST(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    const batch = await prisma.assetGenerationBatch.findUnique({
      where: { id },
      include: { assets: true },
    });
    if (!batch) {
      return NextResponse.json({ success: false, error: "批次不存在" }, { status: 404 });
    }
    const zip = await buildAssetBatchZip({
      batchId: batch.id,
      itemSetId: batch.itemSetId,
      globalArtStyle: batch.globalArtStyle,
      assets: batch.assets.map((asset) => ({
        name: asset.name,
        displayName: asset.displayName,
        sourceItemId: asset.sourceItemId,
        catalogItemId: asset.catalogItemId,
        generatedItemId: asset.generatedItemId,
        role: asset.role,
        count: asset.count,
        imageUrl: asset.imageUrl,
        prompt: asset.prompt,
        negativePrompt: asset.negativePrompt,
      })),
    });
    return new NextResponse(new Uint8Array(zip), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="asset_batch_${batch.id}.zip"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "导出 ZIP 失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
