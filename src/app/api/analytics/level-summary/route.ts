import { NextResponse } from "next/server";
import { z } from "zod";

import { getLevelAnalyticsSummary } from "@/lib/analytics/levelAnalyticsSummary";

const schema = z.object({ levelId: z.string().min(1) });

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { levelId } = schema.parse({ levelId: searchParams.get("levelId") });
    const data = await getLevelAnalyticsSummary(levelId);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "获取分析摘要失败" },
      { status: 400 },
    );
  }
}
