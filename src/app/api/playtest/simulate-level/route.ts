import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { levelConfigSchema } from "@/lib/validators/level";
import { simulateLevelInputSchema } from "@/lib/validators/playtest";
import { simulateLevel } from "@/lib/playtest/simulateLevel";
import { defaultSimulatorConfig } from "@/lib/playtest/defaultSimulatorConfig";

export async function POST(request: Request) {
  try {
    const payload = simulateLevelInputSchema.parse(await request.json());
    const levelRow = await prisma.generatedLevel.findUnique({ where: { id: payload.levelId } });
    if (!levelRow) return NextResponse.json({ success: false, error: "关卡不存在" }, { status: 404 });
    const level = levelConfigSchema.parse(JSON.parse(levelRow.levelJson));
    const result = simulateLevel({
      level,
      config: payload.config ?? defaultSimulatorConfig,
      includeRawSamples: payload.includeRawSamples,
      seed: `single_${payload.levelId}`,
    });
    let runId: string | undefined;
    if (payload.saveRun) {
      const run = await prisma.playtestSimulationRun.create({
        data: {
          name: `Single Playtest ${level.name}`,
          levelIdsJson: JSON.stringify([payload.levelId]),
          simulatorConfigJson: JSON.stringify(payload.config),
          status: "completed",
          summaryJson: JSON.stringify({
            levelCount: 1,
            simulationCountPerLevel: payload.config.simulationCount,
            avgPassRate: result.metrics.passRate,
            avgCompletionTime: result.metrics.avgCompletionTime,
            avgRemainingTime: result.metrics.avgRemainingTime,
            totalIssueCount: result.qaIssues.length,
            needsReviewCount: result.status === "needs_review" ? 1 : 0,
          }),
          resultJson: JSON.stringify({ results: [result] }),
        },
      });
      runId = run.id;
      await prisma.playtestLevelResult.create({
        data: {
          runId: run.id,
          levelId: levelRow.id,
          levelName: levelRow.name,
          levelIndex: levelRow.levelIndex,
          status: result.status,
          passRate: result.metrics.passRate,
          avgCompletionTime: result.metrics.avgCompletionTime,
          avgRemainingTime: result.metrics.avgRemainingTime,
          avgMoves: result.metrics.avgMoves,
          avgSlotPressure: result.metrics.avgSlotPressure,
          failReasonsJson: JSON.stringify(result.failReasons),
          qaIssuesJson: JSON.stringify(result.qaIssues),
          balanceSuggestionsJson: JSON.stringify(result.balanceSuggestions),
          simulationJson: JSON.stringify(result),
        },
      });
      const patched = { ...level, diagnostics: { ...(level.diagnostics ?? {}), playtest: result } };
      await prisma.generatedLevel.update({
        where: { id: levelRow.id },
        data: { levelJson: JSON.stringify(patched), status: result.status === "needs_review" ? "needs_review" : levelRow.status },
      });
    }
    return NextResponse.json({ success: true, data: { runId, result } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "单关模拟失败" }, { status: 400 });
  }
}
