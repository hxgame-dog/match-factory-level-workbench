import { NextResponse } from "next/server";
import { runBatchPlaytest } from "@/lib/playtest/playtestService";
import { simulateBatchInputSchema } from "@/lib/validators/playtest";

export async function POST(request: Request) {
  try {
    const payload = simulateBatchInputSchema.parse(await request.json());
    const data = await runBatchPlaytest({
      levelIds: payload.levelIds,
      config: payload.config,
      runName: payload.runName,
      includeRawSamples: payload.includeRawSamples,
      writeBackToLevels: payload.writeBackToLevels,
    });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "批量模拟失败" }, { status: 400 });
  }
}
