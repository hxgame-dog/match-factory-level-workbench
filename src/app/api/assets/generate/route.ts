import { NextResponse } from "next/server";

import { generateImageAsset } from "@/lib/ai/gemini";
import { getGeminiRuntime } from "@/lib/ai/geminiRuntime";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { generateAssetImageInputSchema } from "@/lib/validators/asset";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = generateAssetImageInputSchema.parse(body);
    if (!input.prompt.trim()) {
      return NextResponse.json({ success: false, error: "Prompt 不能为空" }, { status: 400 });
    }

    const runtime = await getGeminiRuntime();
    const useMock = env.AI_MOCK_MODE && !runtime.hasApiKey;
    const result = await generateImageAsset(
      { ...input, provider: input.provider ?? (useMock ? "mock" : "gemini") },
      { runtime },
    );
    if (input.assetId) {
      await prisma.generatedAsset.update({
        where: { id: input.assetId },
        data: {
          status: result.status === "done" ? "done" : "failed",
          imageUrl: result.imageUrl,
          localPath: result.localPath,
          error: result.error,
        },
      });
    }
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "图片生成失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
