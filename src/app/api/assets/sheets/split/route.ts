import { NextResponse } from "next/server";
import { z } from "zod";

import {
  collectActiveColorKeys,
  filterItemsByBaseName,
  findItemByColorKey,
} from "@/lib/assets/variantSheetHelpers";
import { splitVariantSheet } from "@/lib/assets/splitVariantSheet";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

const inputSchema = z.object({
  batchId: z.string().min(1),
  baseItemName: z.string().min(1),
  imageSize: z.enum(["512x512", "768x768", "1024x1024"]).default("512x512"),
});

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const input = inputSchema.parse(await request.json());

    const batch = await prisma.assetGenerationBatch.findUnique({
      where: { id: input.batchId },
    });
    if (!batch) return NextResponse.json({ success: false, error: "未找到批次" }, { status: 404 });

    const template = await prisma.itemMasterTemplate.findUnique({
      where: { batchId_baseItemName: { batchId: batch.id, baseItemName: input.baseItemName } },
    });
    if (!template) return NextResponse.json({ success: false, error: "未找到物品组" }, { status: 404 });

    if (template.status !== "approved") {
      return NextResponse.json({ success: false, error: "请先确认色板图再切图分配" }, { status: 400 });
    }
    if (!template.sheetImageUrl && !template.sheetLocalPath) {
      return NextResponse.json({ success: false, error: "缺少色板图" }, { status: 400 });
    }

    const itemSet = await prisma.generatedItemSet.findUnique({
      where: { id: batch.itemSetId },
      include: { items: true },
    });
    if (!itemSet) return NextResponse.json({ success: false, error: "未找到道具集" }, { status: 404 });

    const groupItems = filterItemsByBaseName(itemSet.items, input.baseItemName);
    const activeColorKeys = collectActiveColorKeys(groupItems);

    const splits = await splitVariantSheet({
      sheetImageUrl: template.sheetImageUrl,
      sheetLocalPath: template.sheetLocalPath,
      gridRows: template.gridRows,
      gridCols: template.gridCols,
      activeColorKeys,
      baseItemName: input.baseItemName,
      outputSize: input.imageSize,
    });

    const useMock = env.AI_MOCK_MODE;
    let successCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    for (const cell of splits) {
      if (cell.skipped) {
        skippedCount += 1;
        continue;
      }
      const item = findItemByColorKey(groupItems, cell.colorKey);
      if (!item) {
        skippedCount += 1;
        continue;
      }

      const existing = await prisma.generatedAsset.findFirst({
        where: { batchId: batch.id, generatedItemId: item.id },
      });

      const data = {
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
        role: item.role ?? undefined,
        count: item.count ?? undefined,
        baseItemName: template.baseItemName,
        isMaster: false,
        masterTemplateId: template.id,
        sheetIndex: cell.sheetIndex,
        pattern: item.pattern ?? undefined,
        provider: useMock ? "mock" : env.AI_PROVIDER,
        model: template.sheetModel ?? undefined,
        prompt: template.sheetPrompt ?? "-",
        negativePrompt: batch.globalArtStyle ? undefined : undefined,
        status: "done",
        imageUrl: cell.imageUrl,
        localPath: cell.localPath,
        error: null,
      };

      if (existing) {
        await prisma.generatedAsset.update({ where: { id: existing.id }, data });
      } else {
        await prisma.generatedAsset.create({ data });
      }
      successCount += 1;
    }

    await prisma.itemMasterTemplate.update({
      where: { id: template.id },
      data: { status: "split" },
    });

    const failedAssets = await prisma.generatedAsset.count({
      where: { batchId: batch.id, status: "failed" },
    });
    await prisma.assetGenerationBatch.update({
      where: { id: batch.id },
      data: {
        successCount,
        failedCount: failedAssets + failedCount,
        status: successCount > 0 ? "generating" : batch.status,
      },
    });

    await prisma.aiGenerationLog.create({
      data: {
        type: "asset_sheet_split",
        provider: env.AI_PROVIDER,
        model: template.sheetModel,
        prompt: template.sheetPrompt ?? "",
        resultJson: JSON.stringify({ successCount, skippedCount, baseItemName: input.baseItemName }),
        status: "success",
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        batchId: batch.id,
        baseItemName: input.baseItemName,
        successCount,
        skippedCount,
        status: "split",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "切图分配失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
