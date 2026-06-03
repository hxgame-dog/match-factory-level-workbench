import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { getItemBaseName } from "@/lib/items/itemName";
import { prisma } from "@/lib/prisma";
import { getGeminiRuntime } from "@/lib/ai/geminiRuntime";
import type { GenerateItemsResult } from "@/types/ai";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      itemSetId,
      batchName,
      anchorColorKey = "red",
      globalArtStyle,
      negativePrompt,
      imageSize = "512x512",
      backgroundMode = "plain",
      styleProfileId,
      sheetSize = "2048x1024",
    } = body as {
      itemSetId: string;
      batchName: string;
      anchorColorKey?: string;
      globalArtStyle: string;
      negativePrompt?: string;
      imageSize?: "512x512" | "768x768" | "1024x1024";
      backgroundMode?: "transparent" | "plain" | "studio";
      styleProfileId?: string;
      sheetSize?: string;
    };

    if (!itemSetId) return NextResponse.json({ success: false, error: "缺少 itemSetId" }, { status: 400 });
    if (!batchName) return NextResponse.json({ success: false, error: "缺少 batchName" }, { status: 400 });

    const itemSet = await prisma.generatedItemSet.findUnique({
      where: { id: itemSetId },
      include: { items: true },
    });

    if (!itemSet) {
      return NextResponse.json({ success: false, error: "未找到道具集" }, { status: 404 });
    }

    const runtime = await getGeminiRuntime();
    const useMock = env.AI_MOCK_MODE && !runtime.hasApiKey;

    if (styleProfileId) {
      const profile = await prisma.assetStyleProfile.findUnique({ where: { id: styleProfileId } });
      if (!profile) {
        return NextResponse.json({ success: false, error: "未找到风格配置" }, { status: 400 });
      }
    }

    const batch = await prisma.assetGenerationBatch.create({
      data: {
        itemSetId: itemSet.id,
        itemSetName: itemSet.name,
        name: batchName,
        globalArtStyle,
        styleProfileId: styleProfileId ?? undefined,
        provider: useMock ? "mock" : env.AI_PROVIDER,
        model: useMock ? "mock-svg" : runtime.imageModel,
        status: "draft",
        totalCount: itemSet.items.length,
      },
      include: { assets: true },
    });

    if (styleProfileId && sheetSize) {
      await prisma.assetStyleProfile.update({
        where: { id: styleProfileId },
        data: { sheetSize, imageSize, backgroundMode, negativePrompt: negativePrompt ?? undefined },
      });
    }

    const groups = new Map<
      string,
      { baseItemName: string; items: typeof itemSet.items; anchorItemId?: string }
    >();

    for (const item of itemSet.items) {
      const baseItemName = getItemBaseName(item as unknown as GenerateItemsResult["items"][number]);

      const key = baseItemName;
      const entry = groups.get(key) ?? { baseItemName, items: [], anchorItemId: undefined };
      entry.items.push(item);
      groups.set(key, entry);
    }

    // 补充 anchor
    for (const entry of groups.values()) {
      const anchorItem = entry.items.find((i) => i.color1 === anchorColorKey);
      entry.anchorItemId = anchorItem?.id;
    }

    const templates = await Promise.all(
      Array.from(groups.values()).map((entry) => {
        const anchor = entry.anchorItemId ? entry.items.find((i) => i.id === entry.anchorItemId) : undefined;
        return prisma.itemMasterTemplate.upsert({
          where: { batchId_baseItemName: { batchId: batch.id, baseItemName: entry.baseItemName } },
          create: {
            batchId: batch.id,
            baseItemName: entry.baseItemName,
            anchorGeneratedItemId: entry.anchorItemId ?? undefined,
            shape: anchor?.shape ?? undefined,
            size: anchor?.size ?? undefined,
            pattern: anchor?.pattern ?? undefined,
            color1: anchor?.color1 ?? undefined,
            color2: anchor?.color2 ?? undefined,
            status: "draft",
            sheetSize,
            gridRows: 2,
            gridCols: 4,
            masterPrompt: undefined,
            masterImageUrl: undefined,
            masterAssetId: undefined,
          },
          update: {
            anchorGeneratedItemId: entry.anchorItemId ?? undefined,
            shape: anchor?.shape ?? undefined,
            size: anchor?.size ?? undefined,
            pattern: anchor?.pattern ?? undefined,
            color1: anchor?.color1 ?? undefined,
            color2: anchor?.color2 ?? undefined,
            status: "draft",
            sheetSize,
            approvedAt: null,
            approvedBy: null,
            sheetImageUrl: null,
            sheetLocalPath: null,
            sheetPrompt: null,
            sheetModel: null,
            masterPrompt: null,
            masterImageUrl: null,
            masterAssetId: null,
          },
        });
      }),
    );

    // negativePrompt/imageSize/backgroundMode 目前先不落库，后续 UI 再通过批次级 styleProfile 统一管理
    return NextResponse.json({
      success: true,
      data: {
        batchId: batch.id,
        itemSetId: itemSet.id,
        totalBaseItems: templates.length,
        styleProfileId: styleProfileId ?? null,
        templates: templates.map((t) => ({
          id: t.id,
          baseItemName: t.baseItemName,
          anchorGeneratedItemId: t.anchorGeneratedItemId,
          status: t.status,
          shape: t.shape,
          size: t.size,
          pattern: t.pattern,
          color1: t.color1,
          color2: t.color2,
          sheetImageUrl: t.sheetImageUrl,
          sheetSize: t.sheetSize,
        })),
        imageSize,
        sheetSize,
        backgroundMode,
        negativePrompt: negativePrompt ?? "",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "创建母版计划失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

