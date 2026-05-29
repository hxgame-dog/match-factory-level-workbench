import { NextResponse } from "next/server";
import { z } from "zod";

import { persistPlaytestRun } from "@/lib/playtest/persistPlaytestRun";
import type { PlaytestLevelSimulationResult } from "@/types/playtest";
import { playtestLevelSimulationResultSchema, simulatorConfigSchema } from "@/lib/validators/playtest";

const schema = z.object({
  runName: z.string().min(1),
  levelIds: z.array(z.string()).min(1),
  config: simulatorConfigSchema,
  results: z.array(playtestLevelSimulationResultSchema),
  writeBackToLevels: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());
    const data = await persistPlaytestRun({
      runName: payload.runName,
      levelIds: payload.levelIds,
      config: payload.config,
      results: payload.results as PlaytestLevelSimulationResult[],
      writeBackToLevels: payload.writeBackToLevels,
    });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "保存模拟结果失败" },
      { status: 400 },
    );
  }
}
