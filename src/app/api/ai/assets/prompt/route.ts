import { NextResponse } from "next/server";

import { generateAssetPrompt } from "@/lib/ai/gemini";
import {
  generateAssetPromptInputSchema,
  generateAssetPromptResultSchema,
} from "@/lib/validators/ai";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = generateAssetPromptInputSchema.parse(body);
    const result = await generateAssetPrompt(input);
    const validated = generateAssetPromptResultSchema.parse(result);
    return NextResponse.json({ success: true, data: validated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "图片提示词生成失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
