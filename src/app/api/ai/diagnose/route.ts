import { NextResponse } from "next/server";

import { diagnoseLevel } from "@/lib/ai/gemini";
import {
  diagnoseLevelInputSchema,
  diagnoseLevelResultSchema,
} from "@/lib/validators/ai";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = diagnoseLevelInputSchema.parse(body);
    const result = await diagnoseLevel(input);
    const validated = diagnoseLevelResultSchema.parse(result);
    return NextResponse.json({ success: true, data: validated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "关卡诊断失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
