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

    const anchor = template.anchorGeneratedItemId
      ? itemSet.items.find((i) => i.id === template.anchorGeneratedItemId)
      : itemSet.items.find(
          (i) => getItemBaseName(i as unknown as GenerateItemsResult["items"][number]) === input.baseItemName,
        );

    if (!anchor) return NextResponse.json({ success: false, error: "未找到锚点物品" }, { status: 400 });

    const runtime = await getGeminiRuntime();
    const useMock = env.AI_MOCK_MODE && !runtime.hasApiKey;

    // 只生成锚点母版
    const existing = await prisma.generatedAsset.findFirst({
      where: { batchId: batch.id, generatedItemId: anchor.id },
    });

    const asset = existing
      ? existing
      : await prisma.generatedAsset.create({
          data: {
            batchId: batch.id,
            generatedItemId: anchor.id,
            name: anchor.name,
            displayName: anchor.displayName ?? undefined,
            category1: anchor.category1,
            category2: anchor.category2 ?? undefined,
            color1: anchor.color1 ?? undefined,
            color2: anchor.color2 ?? undefined,
            shape: anchor.shape ?? undefined,
            size: anchor.size ?? undefined,
            role: anchor.role ?? undefined,
            count: anchor.count ?? undefined,
            baseItemName: template.baseItemName,
            isMaster: true,
            masterTemplateId: template.id,
            pattern: anchor.pattern ?? undefined,
            provider: useMock ? "mock" : env.AI_PROVIDER,
            model: useMock ? "mock-svg" : runtime.imageModel,
            status: "prompt_ready",
            prompt: "-",
          },
        });

    const promptRes = await generateAssetPrompt({
      item: {
        name: anchor.name,
        displayName: anchor.displayName ?? undefined,
        category1: anchor.category1,
        category2: anchor.category2 ?? undefined,
        color1: anchor.color1 ?? undefined,
        color2: anchor.color2 ?? undefined,
        shape: anchor.shape ?? undefined,
        size: anchor.size ?? undefined,
        role: anchor.role ?? undefined,
        pattern: anchor.pattern ?? undefined,
      },
      globalArtStyle: batch.globalArtStyle ?? "",
      negativePrompt: input.negativePrompt,
    });

    await prisma.generatedAsset.update({
      where: { id: asset.id },
      data: {
        prompt: promptRes.prompt,
        negativePrompt: promptRes.negativePrompt ?? input.negativePrompt ?? undefined,
        status: "generating",
      },
    });

    const imageRes = await generateImageAsset(
      {
        assetId: asset.id,
        item: {
          generatedItemId: anchor.id,
          sourceItemId: anchor.sourceItemId ?? undefined,
          catalogItemId: anchor.catalogItemId ?? undefined,
          name: anchor.name,
          displayName: anchor.displayName ?? undefined,
          category1: anchor.category1,
          category2: anchor.category2 ?? undefined,
          color1: anchor.color1 ?? undefined,
          color2: anchor.color2 ?? undefined,
          shape: anchor.shape ?? undefined,
          size: anchor.size ?? undefined,
          role: anchor.role ?? undefined,
          count: anchor.count ?? undefined,
          pattern: anchor.pattern ?? undefined,
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

    await prisma.itemMasterTemplate.update({
      where: { id: template.id },
      data: {
        status: imageRes.status === "done" ? "ready" : "failed",
        masterAssetId: asset.id,
        masterImageUrl: imageRes.imageUrl ?? undefined,
        masterPrompt: promptRes.prompt,
      },
    });

    const updatedAsset = await prisma.generatedAsset.findUnique({ where: { id: asset.id } });

    return NextResponse.json({
      success: true,
      data: {
        templateId: template.id,
        anchorAssetId: asset.id,
        status: imageRes.status,
        masterImageUrl: updatedAsset?.imageUrl ?? imageRes.imageUrl,
        masterPrompt: promptRes.prompt,
        anchorName: anchor.name,
        anchorDisplayName: anchor.displayName,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "生成母版失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

