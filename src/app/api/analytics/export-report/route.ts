import { NextResponse } from "next/server";
import { z } from "zod";

import { exportAnalyticsFeedbackReport } from "@/lib/analytics/exportAnalyticsFeedbackReport";

const schema = z.object({ batchId: z.string() });

export async function POST(request: Request) {
  try {
    const { batchId } = schema.parse(await request.json());
    const data = await exportAnalyticsFeedbackReport(batchId);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "导出报告失败" }, { status: 400 });
  }
}
