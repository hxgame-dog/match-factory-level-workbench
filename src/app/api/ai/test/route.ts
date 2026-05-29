import { NextResponse } from "next/server";

import { generateText, getAiStatus } from "@/lib/ai/gemini";
import { getGeminiRuntime } from "@/lib/ai/geminiRuntime";
import { geminiTestSchema } from "@/lib/validators/geminiSettings";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const input = geminiTestSchema.parse({
      prompt: body?.prompt ?? "请返回一句简短问候",
      textModel: body?.textModel,
      apiKey: body?.apiKey,
    });

    const runtime = await getGeminiRuntime();
    const apiKey = input.apiKey?.trim() || runtime.apiKey;
    if (!apiKey && !(await getAiStatus()).mockMode) {
      return NextResponse.json({ success: false, error: "请先配置 Gemini API Key" }, { status: 400 });
    }

    const status = await getAiStatus();
    const result = await generateText(input.prompt, {
      runtime: {
        apiKey,
        textModel: input.textModel ?? runtime.textModel,
      },
    });

    return NextResponse.json({
      success: true,
      provider: status.provider,
      model: input.textModel ?? runtime.textModel,
      mockMode: status.mockMode && !apiKey,
      result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gemini 连接测试失败";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
