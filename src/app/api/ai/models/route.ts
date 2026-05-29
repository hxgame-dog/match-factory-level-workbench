import { NextResponse } from "next/server";

import { listGeminiModels } from "@/lib/ai/geminiImageGeneration";
import { getGeminiRuntime } from "@/lib/ai/geminiRuntime";
import { geminiModelsRequestSchema } from "@/lib/validators/geminiSettings";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const payload = geminiModelsRequestSchema.parse(body);
    const runtime = await getGeminiRuntime();
    const apiKey = payload.apiKey?.trim() || runtime.apiKey;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: "请先保存 Gemini API Key" }, { status: 400 });
    }

    const models = await listGeminiModels(apiKey);
    return NextResponse.json({
      success: true,
      data: {
        models,
        imageModels: models.filter((m) => m.imageCapable),
        textModels: models.filter((m) => m.textCapable),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "获取模型列表失败" },
      { status: 400 },
    );
  }
}
