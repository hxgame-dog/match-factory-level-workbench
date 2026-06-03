import { NextResponse } from "next/server";
import { z } from "zod";

import { buildVariantSheetPrompt } from "@/lib/ai/prompts/variantSheetPrompt";
import { generateVariantSheetImage, generateMockVariantSheetImage } from "@/lib/ai/variantSheetGeneration";
import { getGeminiRuntime } from "@/lib/ai/geminiRuntime";
import {
  collectActiveColorKeys,
  filterItemsByBaseName,
} from "@/lib/assets/variantSheetHelpers";
import { loadImageBytesFromStoredPath } from "@/lib/assets/saveReferenceImage";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

const inputSchema = z.object({
  batchId: z.string().min(1),
  baseItemName: z.string().min(1),
  negativePrompt: z.string().optional(),
  sheetSize: z.string().optional(),
});

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const input = inputSchema.parse(await request.json());

    const batch = await prisma.assetGenerationBatch.findUnique({
      where: { id: input.batchId },
      include: { styleProfile: true },
    });
    if (!batch) return NextResponse.json({ success: false, error: "未找到批次" }, { status: 404 });

    const template = await prisma.itemMasterTemplate.findUnique({
      where: { batchId_baseItemName: { batchId: batch.id, baseItemName: input.baseItemName } },
    });
    if (!template) return NextResponse.json({ success: false, error: "未找到物品组" }, { status: 404 });

    const itemSet = await prisma.generatedItemSet.findUnique({
      where: { id: batch.itemSetId },
      include: { items: true },
    });
    if (!itemSet) return NextResponse.json({ success: false, error: "未找到道具集" }, { status: 404 });

    const groupItems = filterItemsByBaseName(itemSet.items, input.baseItemName);
    if (groupItems.length === 0) {
      return NextResponse.json({ success: false, error: "该物品组无道具" }, { status: 400 });
    }

    const anchor = template.anchorGeneratedItemId
      ? groupItems.find((i) => i.id === template.anchorGeneratedItemId) ?? groupItems[0]
      : groupItems[0];

    const styleProfile = batch.styleProfile;
    const refBytes = await loadImageBytesFromStoredPath(
      styleProfile?.referenceImageUrl,
      styleProfile?.referenceLocalPath,
    );
    if (!refBytes) {
      return NextResponse.json(
        { success: false, error: "请先在风格设置中上传并分析参考图，以持久化风格参考" },
        { status: 400 },
      );
    }

    const activeColorKeys = collectActiveColorKeys(groupItems);
    const sheetPrompt = buildVariantSheetPrompt({
      anchor: {
        baseItemName: input.baseItemName,
        displayName: anchor.displayName ?? undefined,
        category1: anchor.category1,
        shape: anchor.shape ?? undefined,
        size: anchor.size ?? undefined,
        pattern: anchor.pattern ?? undefined,
      },
      globalArtStyle: batch.globalArtStyle ?? "",
      negativePrompt: input.negativePrompt ?? styleProfile?.negativePrompt ?? undefined,
      activeColorKeys,
    });

    const sheetSize = input.sheetSize ?? template.sheetSize ?? styleProfile?.sheetSize ?? "2048x1024";
    const runtime = await getGeminiRuntime();
    const useMock = env.AI_MOCK_MODE && !runtime.hasApiKey;

    await prisma.itemMasterTemplate.update({
      where: { id: template.id },
      data: { status: "generating", sheetPrompt },
    });

    let imageResult: { imageUrl: string; localPath: string; model: string };
    if (useMock) {
      imageResult = await generateMockVariantSheetImage({
        baseItemName: input.baseItemName,
        sheetSize,
      });
    } else {
      if (!runtime.apiKey) {
        return NextResponse.json({ success: false, error: "请先配置 Gemini API Key" }, { status: 400 });
      }
      imageResult = await generateVariantSheetImage({
        apiKey: runtime.apiKey,
        model: runtime.imageModel,
        prompt: sheetPrompt,
        negativePrompt: input.negativePrompt ?? styleProfile?.negativePrompt ?? undefined,
        sheetSize,
        referenceImageBytes: refBytes,
        referenceMimeType: "image/png",
        baseItemName: input.baseItemName,
      });
    }

    const updated = await prisma.itemMasterTemplate.update({
      where: { id: template.id },
      data: {
        status: "ready",
        sheetImageUrl: imageResult.imageUrl,
        sheetLocalPath: imageResult.localPath,
        sheetPrompt,
        sheetModel: imageResult.model,
        sheetSize,
        gridRows: 2,
        gridCols: 4,
      },
    });

    await prisma.aiGenerationLog.create({
      data: {
        type: "asset_sheet",
        provider: useMock ? "mock" : env.AI_PROVIDER,
        model: imageResult.model,
        prompt: sheetPrompt,
        resultJson: JSON.stringify({ sheetImageUrl: imageResult.imageUrl, baseItemName: input.baseItemName }),
        status: "success",
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        templateId: updated.id,
        baseItemName: input.baseItemName,
        status: updated.status,
        sheetImageUrl: updated.sheetImageUrl,
        sheetPrompt,
        activeColorKeys,
        anchorName: anchor.name,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "色板生成失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
