import { NextResponse } from "next/server";

import { autoGenerateLevels } from "@/lib/auto-level/autoGenerateLevels";
import { autoGenerateLevelsInputSchema } from "@/lib/validators/autoLevel";

export async function POST(request: Request) {
  try {
    const payload = autoGenerateLevelsInputSchema.parse(await request.json());
    const data = await autoGenerateLevels(payload);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "自动续关生成失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
