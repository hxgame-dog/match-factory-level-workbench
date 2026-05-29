import { NextResponse } from "next/server";

import { generateGeminiImage } from "@/lib/ai/geminiImageGeneration";
import { getGeminiRuntime } from "@/lib/ai/geminiRuntime";
import { geminiTestImageSchema } from "@/lib/validators/geminiSettings";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const input = geminiTestImageSchema.parse(body);
    const runtime = await getGeminiRuntime();
    const apiKey = input.apiKey?.trim() || runtime.apiKey;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: "请先保存 Gemini API Key" }, { status: 400 });
    }

    const imageModel = input.imageModel ?? runtime.imageModel;
    const generated = await generateGeminiImage({
      apiKey,
      model: imageModel,
      prompt: input.prompt,
      imageSize: "512x512",
      itemName: "connection_test",
    });

    return NextResponse.json({
      success: true,
      data: {
        model: generated.model,
        imageUrl: generated.imageUrl,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "图像生成测试失败" },
      { status: 500 },
    );
  }
}
