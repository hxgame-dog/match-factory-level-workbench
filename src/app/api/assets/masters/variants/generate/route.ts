import { NextResponse } from "next/server";
import { z } from "zod";

import { env } from "@/lib/env";
import { generateAssetPrompt, generateImageAsset } from "@/lib/ai/gemini";
import { getGeminiRuntime } from "@/lib/ai/geminiRuntime";
import { getItemBaseName } from "@/lib/items/itemName";
import { prisma } from "@/lib/prisma";
import type { GenerateItemsResult } from "@/types/ai";

const inputSchema = z.object({
  batchId: z.string().min(1),
  baseItemName: z.string().min(1),
  negativePrompt: z.string().optional(),
  imageSize: z.enum(["512x512", "768x768", "1024x1024"]).default("512x512"),
  backgroundMode: z.enum(["transparent", "plain", "studio"]).default("plain"),
});

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const input = inputSchema.parse(await request.json());

    const batch = await prisma.assetGenerationBatch.findUnique({
      where: { id: input.batchId },
    });
    if (!batch) return NextResponse.json({ success: false, error: "未找到批次" }, { status: 404 });

    const itemSet = await prisma.generatedItemSet.findUnique({
      where: { id: batch.itemSetId },
      include: { items: true },
    });
    if (!itemSet) return NextResponse.json({ success: false, error: "未找到道具集" }, { status: 404 });

    const template = await prisma.itemMasterTemplate.findUnique({
      where: { batchId_baseItemName: { batchId: batch.id, baseItemName: input.baseItemName } },
    });
    if (!template) return NextResponse.json({ success: false, error: "未找到母版模板" }, { status: 404 });

    if (template.status !== "approved") {
      return NextResponse.json({ success: false, error: "母版未审批通过，无法批量生成变体" }, { status: 400 });
    }

    const variants = itemSet.items.filter(
      (i) => getItemBaseName(i as unknown as GenerateItemsResult["items"][number]) === input.baseItemName,
    );
    if (variants.length === 0) {
      return NextResponse.json({ success: false, error: "未找到该物品组的变体" }, { status: 400 });
    }

    const runtime = await getGeminiRuntime();
    const useMock = env.AI_MOCK_MODE && !runtime.hasApiKey;

    let successCount = 0;
    let failedCount = 0;

    for (const item of variants) {
      // 已有 done 结果就跳过，避免重复消耗
      const existing = await prisma.generatedAsset.findFirst({
        where: { batchId: batch.id, generatedItemId: item.id, isMaster: false },
      });
      if (existing?.status === "done" && existing.imageUrl) continue;

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
          role: item.role ?? undefined,
          pattern: item.pattern ?? undefined,
        },
        globalArtStyle: batch.globalArtStyle ?? "",
        negativePrompt: input.negativePrompt,
      });

      const asset = await prisma.generatedAsset.create({
        data: {
          batchId: batch.id,
          generatedItemId: item.id,
          name: item.name,
          displayName: item.displayName ?? undefined,
          category1: item.category1,
          category2: item.category2 ?? undefined,
          color1: item.color1 ?? undefined,
          color2: item.color2 ?? undefined,
          shape: item.shape ?? undefined,
          size: item.size ?? undefined,
          role: item.role ?? undefined,
          count: item.count ?? undefined,
          baseItemName: template.baseItemName,
          isMaster: false,
          masterTemplateId: template.id,
          pattern: item.pattern ?? undefined,
          provider: useMock ? "mock" : env.AI_PROVIDER,
          model: useMock ? "mock-svg" : runtime.imageModel,
          status: "generating",
          prompt: promptRes.prompt,
          negativePrompt: promptRes.negativePrompt ?? input.negativePrompt ?? undefined,
        },
      });

      const imageRes = await generateImageAsset(
        {
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
            role: item.role ?? undefined,
            count: item.count ?? undefined,
            pattern: item.pattern ?? undefined,
          },
          prompt: promptRes.prompt,
          negativePrompt: promptRes.negativePrompt ?? input.negativePrompt ?? undefined,
          provider: useMock ? "mock" : "gemini",
          imageSize: input.imageSize,
          backgroundMode: input.backgroundMode,
        },
        { runtime },
      );

      await prisma.generatedAsset.update({
        where: { id: asset.id },
        data: {
          status: imageRes.status === "done" ? "done" : "failed",
          imageUrl: imageRes.imageUrl,
          localPath: imageRes.localPath,
          error: imageRes.error,
        },
      });

      if (imageRes.status === "done") successCount += 1;
      else failedCount += 1;
    }

    await prisma.assetGenerationBatch.update({
      where: { id: batch.id },
      data: {
        successCount,
        failedCount,
        status: failedCount > 0 ? "failed" : "generating",
      },
    });

    return NextResponse.json({ success: true, data: { batchId: batch.id, baseItemName: input.baseItemName, successCount, failedCount, assetTotal: variants.length } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "生成变体失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

