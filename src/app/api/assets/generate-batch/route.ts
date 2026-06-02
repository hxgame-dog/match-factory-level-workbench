import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { generateAssetPrompt, generateImageAsset } from "@/lib/ai/gemini";
import { getGeminiRuntime } from "@/lib/ai/geminiRuntime";
import { getItemBaseName } from "@/lib/items/itemName";
import { prisma } from "@/lib/prisma";
import { generateAssetBatchInputSchema } from "@/lib/validators/asset";
import type { GenerateItemsResult } from "@/types/ai";

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

    const runtime = await getGeminiRuntime();
    const useMock = env.AI_MOCK_MODE && !runtime.hasApiKey;

    const batch = await prisma.assetGenerationBatch.create({
      data: {
        itemSetId: itemSet.id,
        itemSetName: itemSet.name,
        name: input.batchName,
        globalArtStyle: input.globalArtStyle,
        provider: useMock ? "mock" : env.AI_PROVIDER,
        model: useMock ? "mock-svg" : runtime.imageModel,
        status: "generating",
        totalCount: itemSet.items.length,
      },
    });

    let successCount = 0;
    let failedCount = 0;
    for (const item of itemSet.items) {
      const promptRes = await generateAssetPrompt({
        item: {
          name: item.name,
          displayName: item.displayName ?? undefined,
          category1: item.category1,
          category2: item.category2 ?? undefined,
          color1: item.color1 ?? undefined,
          color2: item.color2 ?? undefined,
          shape: item.shape ?? undefined,
          size: item.size ?? undefined,
          role: item.role,
        },
        globalArtStyle: input.globalArtStyle,
        negativePrompt: input.negativePrompt,
      });

      const asset = await prisma.generatedAsset.create({
        data: {
          batchId: batch.id,
          generatedItemId: item.id,
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
          role: item.role,
          count: item.count,
          baseItemName: getItemBaseName(item as unknown as GenerateItemsResult["items"][number]),
          isMaster: false,
          prompt: item.imagePrompt ?? promptRes.prompt,
          negativePrompt: promptRes.negativePrompt ?? input.negativePrompt,
          provider: useMock ? "mock" : env.AI_PROVIDER,
          model: useMock ? "mock-svg" : runtime.imageModel,
          status: "prompt_ready",
        },
      });

      const imageRes = await generateImageAsset({
        assetId: asset.id,
        item: {
          generatedItemId: item.id,
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
          role: item.role,
          count: item.count,
        },
        prompt: asset.prompt,
        negativePrompt: asset.negativePrompt ?? undefined,
        provider: useMock ? "mock" : "gemini",
        imageSize: input.imageSize,
        backgroundMode: input.backgroundMode,
      }, { runtime });

      if (imageRes.status === "done") {
        successCount += 1;
      } else {
        failedCount += 1;
      }
      await prisma.generatedAsset.update({
        where: { id: asset.id },
        data: {
          status: imageRes.status === "done" ? "done" : "failed",
          imageUrl: imageRes.imageUrl,
          localPath: imageRes.localPath,
          error: imageRes.error,
        },
      });
    }

    await prisma.assetGenerationBatch.update({
      where: { id: batch.id },
      data: {
        status: failedCount > 0 ? "failed" : "done",
        successCount,
        failedCount,
      },
    });

    return NextResponse.json({
      success: true,
      data: { batchId: batch.id, totalCount: itemSet.items.length, successCount, failedCount },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "批量生成失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
