import { NextResponse } from "next/server";

import { generateImageAsset } from "@/lib/ai/gemini";
import { getGeminiRuntime } from "@/lib/ai/geminiRuntime";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function POST(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    const asset = await prisma.generatedAsset.findUnique({ where: { id } });
    if (!asset) {
      return NextResponse.json({ success: false, error: "资源不存在" }, { status: 404 });
    }
    const runtime = await getGeminiRuntime();
    const useMock = env.AI_MOCK_MODE && !runtime.hasApiKey;
    const result = await generateImageAsset(
      {
      assetId: id,
      item: {
        generatedItemId: asset.generatedItemId ?? undefined,
        sourceItemId: asset.sourceItemId ?? undefined,
        catalogItemId: asset.catalogItemId ?? undefined,
        name: asset.name,
        displayName: asset.displayName ?? undefined,
        category1: asset.category1,
        category2: asset.category2 ?? undefined,
        color1: asset.color1 ?? undefined,
        color2: asset.color2 ?? undefined,
        shape: asset.shape ?? undefined,
        size: asset.size ?? undefined,
        role: asset.role ?? undefined,
        count: asset.count ?? undefined,
      },
      prompt: asset.prompt,
      negativePrompt: asset.negativePrompt ?? undefined,
      provider: useMock ? "mock" : "gemini",
    },
      { runtime },
    );
    await prisma.generatedAsset.update({
      where: { id },
      data: {
        retryCount: { increment: 1 },
        status: result.status === "done" ? "done" : "failed",
        imageUrl: result.imageUrl,
        localPath: result.localPath,
        error: result.error,
      },
    });
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "重试失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
