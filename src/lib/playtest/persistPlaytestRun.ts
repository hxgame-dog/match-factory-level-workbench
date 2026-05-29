import { prisma } from "@/lib/prisma";
import { levelConfigSchema } from "@/lib/validators/level";
import type { PlaytestLevelSimulationResult, PlaytestSimulationResult, SimulatorConfig } from "@/types/playtest";

function buildSummary(results: PlaytestLevelSimulationResult[], simulationCountPerLevel: number) {
  const avg = (list: number[]) => (list.length ? list.reduce((a, b) => a + b, 0) / list.length : 0);
  return {
    levelCount: results.length,
    simulationCountPerLevel,
    avgPassRate: avg(results.map((r) => r.metrics.passRate)),
    avgCompletionTime: avg(results.map((r) => r.metrics.avgCompletionTime)),
    avgRemainingTime: avg(results.map((r) => r.metrics.avgRemainingTime)),
    totalIssueCount: results.reduce((s, r) => s + r.qaIssues.length, 0),
    needsReviewCount: results.filter((r) => r.status === "needs_review").length,
  };
}

export async function persistPlaytestRun(input: {
  runName: string;
  levelIds: string[];
  config: SimulatorConfig;
  results: PlaytestLevelSimulationResult[];
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

  if (input.writeBackToLevels) {
    const rows = await prisma.generatedLevel.findMany({ where: { id: { in: input.levelIds } } });
    const rowMap = new Map(rows.map((r) => [r.id, r]));
    for (const sim of input.results) {
      const row = rowMap.get(sim.levelId);
      if (!row) continue;
      try {
        const level = levelConfigSchema.parse(JSON.parse(row.levelJson));
        const nextLevel = { ...level, diagnostics: { ...(level.diagnostics ?? {}), playtest: sim } };
        await prisma.generatedLevel.update({
          where: { id: row.id },
          data: {
            levelJson: JSON.stringify(nextLevel),
            status: sim.status === "needs_review" ? "needs_review" : row.status,
          },
        });
      } catch {
        // 回写失败不阻断保存
      }
    }
  }

  for (const sim of input.results) {
    await prisma.playtestLevelResult.create({
      data: {
        runId: run.id,
        levelId: sim.levelId,
        levelName: sim.levelName,
        levelIndex: sim.levelIndex ?? null,
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
  }

  const summary = buildSummary(input.results, input.config.simulationCount);
  const output: PlaytestSimulationResult = { runId: run.id, summary, results: input.results };
  await prisma.playtestSimulationRun.update({
    where: { id: run.id },
    data: {
      status: input.results.some((r) => r.status === "invalid_level") ? "partial_failed" : "completed",
      summaryJson: JSON.stringify(summary),
      resultJson: JSON.stringify(output),
    },
  });
  return output;
}
