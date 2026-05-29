import { NextResponse } from "next/server";

import { generateItemTable } from "@/lib/ai/gemini";
import { generateItemsInputSchema, generateItemsResultSchema } from "@/lib/validators/ai";

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
