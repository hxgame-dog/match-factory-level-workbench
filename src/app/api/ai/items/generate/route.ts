import { NextResponse } from "next/server";

import { generateItemTable } from "@/lib/ai/gemini";
import { generateItemsInputSchema, generateItemsResultSchema } from "@/lib/validators/ai";

// 分批调用 Gemini 串行生成，耗时较长，需放宽函数超时（默认 10s 会导致 Failed to fetch）
export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = generateItemsInputSchema.parse(body);

    const result = await generateItemTable(input);
    const validated = generateItemsResultSchema.parse(result);
    return NextResponse.json({
      success: true,
      data: validated,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "AI 道具生成请求失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
