import { NextResponse } from "next/server";

import { finalizeGeneratedItemTable } from "@/lib/ai/gemini";
import { finalizeItemsInputSchema, generateItemsResultSchema } from "@/lib/validators/ai";

// 合并所有批次后做颜色展开/编号/校验，纯 CPU 处理，默认时限足够
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = finalizeItemsInputSchema.parse(body);
    const result = finalizeGeneratedItemTable(input);
    const validated = generateItemsResultSchema.parse(result);
    return NextResponse.json({ success: true, data: validated });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "道具表最终化失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
