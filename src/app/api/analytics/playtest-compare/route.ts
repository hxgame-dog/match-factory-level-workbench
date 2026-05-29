import { NextResponse } from "next/server";
import { z } from "zod";

import { buildPlaytestAnalyticsCompare } from "@/lib/analytics/buildCalibrationDataset";

const schema = z.object({
  levelIds: z.array(z.string()).min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { levelIds } = schema.parse(body);
    const data = await buildPlaytestAnalyticsCompare(levelIds);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "对比失败" },
      { status: 400 },
    );
  }
}
