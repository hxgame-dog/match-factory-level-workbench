import { NextResponse } from "next/server";

import { generateStyleBibleFromReference } from "@/lib/ai/styleBibleFromReference";
import { getGeminiRuntime } from "@/lib/ai/geminiRuntime";
import { env } from "@/lib/env";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    const hint = form.get("hint");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ success: false, error: "请上传参考图片" }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || "image/png";

    const runtime = await getGeminiRuntime();
    const useMock = env.AI_MOCK_MODE && !runtime.hasApiKey;

    if (!runtime.apiKey && !useMock) {
      return NextResponse.json({ success: false, error: "请先保存 Gemini API Key" }, { status: 400 });
    }

    const result = await generateStyleBibleFromReference({
      apiKey: runtime.apiKey ?? "",
      referenceBytes: bytes,
      referenceMimeType: mimeType,
      userHint: typeof hint === "string" ? hint : undefined,
      useMock,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "生成 Style Bible 失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

