import { NextResponse } from "next/server";

import { generateItemChunk } from "@/lib/ai/gemini";
import { generateItemChunkInputSchema } from "@/lib/validators/ai";

// 单批生成（≤60 种），由前端编排循环调用；单批耗时短，放宽至 120s 足够
export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = generateItemChunkInputSchema.parse(body);
    const chunk = await generateItemChunk(input);
    return NextResponse.json({ success: true, data: chunk });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "AI 单批道具生成失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
