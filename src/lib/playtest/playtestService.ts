import { prisma } from "@/lib/prisma";
import { levelConfigSchema } from "@/lib/validators/level";
import type { PlaytestLevelSimulationResult, PlaytestSimulationResult, SimulatorConfig } from "@/types/playtest";
import { simulateLevel } from "./simulateLevel";

export async function runBatchPlaytest(input: {
  levelIds: string[];
  config: SimulatorConfig;
  runName: string;
  includeRawSamples?: boolean;
  writeBackToLevels?: boolean;
}): Promise<PlaytestSimulationResult> {
  const run = await prisma.playtestSimulationRun.create({
    data: {
      name: input.runName,
      levelIdsJson: JSON.stringify(input.levelIds),
      simulatorConfigJson: JSON.stringify(input.config),
      status: "running",
    },
  });
  const rows = await prisma.generatedLevel.findMany({ where: { id: { in: input.levelIds } } });
  const results: PlaytestLevelSimulationResult[] = [];
  for (const row of rows) {
    try {
      const level = levelConfigSchema.parse(JSON.parse(row.levelJson));
      const sim = simulateLevel({ level, config: input.config, seed: `${run.id}_${row.id}`, includeRawSamples: input.includeRawSamples });
      results.push(sim);
      await prisma.playtestLevelResult.create({
        data: {
          runId: run.id,
          levelId: row.id,
          levelName: row.name,
          levelIndex: row.levelIndex,
          status: sim.status,
          passRate: sim.metrics.passRate,
          avgCompletionTime: sim.metrics.avgCompletionTime,
          avgRemainingTime: sim.metrics.avgRemainingTime,
          avgMoves: sim.metrics.avgMoves,
          avgSlotPressure: sim.metrics.avgSlotPressure,
          failReasonsJson: JSON.stringify(sim.failReasons),
          qaIssuesJson: JSON.stringify(sim.qaIssues),
          balanceSuggestionsJson: JSON.stringify(sim.balanceSuggestions),
          simulationJson: JSON.stringify(sim),
        },
      });
      if (input.writeBackToLevels) {
        const nextLevel = { ...level, diagnostics: { ...(level.diagnostics ?? {}), playtest: sim } };
        await prisma.generatedLevel.update({
          where: { id: row.id },
          data: { levelJson: JSON.stringify(nextLevel), status: sim.status === "needs_review" ? "needs_review" : row.status },
        });
      }
    } catch (error) {
      const invalidResult: PlaytestLevelSimulationResult = {
        levelId: row.id,
        levelName: row.name,
        levelIndex: row.levelIndex ?? undefined,
        status: "invalid_level",
        metrics: { passRate: 0, failRate: 1, avgCompletionTime: 0, avgRemainingTime: 0, avgMoves: 0, avgSlotPressure: 0, maxSlotPressure: 0, targetCompletionRate: 0, targetStarvationTurnsAvg: 0, firstTargetFoundTimeAvg: 0, wastedMoveRatio: 0 },
        profileBreakdown: [],
        failReasons: [{ reason: "invalid_level", count: 1, ratio: 1 }],
        qaIssues: [{ code: "invalid_level", severity: "critical", title: "关卡解析失败", detail: error instanceof Error ? error.message : "未知错误" }],
        balanceSuggestions: [],
      };
      results.push(invalidResult);
    }
  }
  const avg = (list: number[]) => (list.length ? list.reduce((a, b) => a + b, 0) / list.length : 0);
  const summary = {
    levelCount: results.length,
    simulationCountPerLevel: input.config.simulationCount,
    avgPassRate: avg(results.map((r) => r.metrics.passRate)),
    avgCompletionTime: avg(results.map((r) => r.metrics.avgCompletionTime)),
    avgRemainingTime: avg(results.map((r) => r.metrics.avgRemainingTime)),
    totalIssueCount: results.reduce((s, r) => s + r.qaIssues.length, 0),
    needsReviewCount: results.filter((r) => r.status === "needs_review").length,
  };
  const output: PlaytestSimulationResult = { runId: run.id, summary, results };
  await prisma.playtestSimulationRun.update({
    where: { id: run.id },
    data: {
      status: results.some((r) => r.status === "invalid_level") ? "partial_failed" : "completed",
      summaryJson: JSON.stringify(summary),
      resultJson: JSON.stringify(output),
    },
  });
  return output;
}
