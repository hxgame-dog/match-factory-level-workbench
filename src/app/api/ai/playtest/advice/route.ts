import { NextResponse } from "next/server";
import { z } from "zod";
import { generatePlaytestAdvice } from "@/lib/ai/gemini";
import { levelConfigSchema } from "@/lib/validators/level";

const schema = z.object({
  level: levelConfigSchema.optional(),
  playtestResult: z.unknown(),
  formulaDiagnosis: z.unknown().optional(),
});

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());
    const data = await generatePlaytestAdvice({
      level: payload.level,
      playtestResult: payload.playtestResult as never,
      formulaDiagnosis: payload.formulaDiagnosis as never,
    });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "AI 试玩建议失败" }, { status: 400 });
  }
}
