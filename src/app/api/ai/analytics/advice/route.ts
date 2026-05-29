import { NextResponse } from "next/server";
import { z } from "zod";

import { generateAnalyticsFeedbackAdvice } from "@/lib/ai/gemini";
import { levelConfigSchema } from "@/lib/validators/level";
import { standardAnalyticsRowSchema } from "@/lib/validators/analytics";

const schema = z.object({
  level: levelConfigSchema.optional(),
  analytics: standardAnalyticsRowSchema,
  feedbackDiagnosis: z.unknown(),
  formulaDiagnosis: z.unknown().optional(),
  playtestResult: z.unknown().optional(),
});

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());
    const data = await generateAnalyticsFeedbackAdvice({
      level: payload.level,
      analytics: payload.analytics,
      feedbackDiagnosis: payload.feedbackDiagnosis as never,
      formulaDiagnosis: payload.formulaDiagnosis as never,
      playtestResult: payload.playtestResult as never,
    });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "AI 分析建议失败" }, { status: 400 });
  }
}
