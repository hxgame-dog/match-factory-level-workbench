import type { LevelConfig } from "@/types/level";
import type { PlayerRunResult, PlaytestLevelSimulationResult, SimulatorConfig } from "@/types/playtest";
import { aggregateSimulation } from "./aggregateSimulation";
import { evaluateQaRules } from "./qaRules";
import { simulatePlayerRun } from "./simulatePlayerRun";

export function simulateLevel(input: {
  level: LevelConfig;
  config: SimulatorConfig;
  seed?: string;
  includeRawSamples?: boolean;
}): PlaytestLevelSimulationResult {
  const totalWeight = input.config.playerProfiles.reduce((s, p) => s + Math.max(0, p.weight), 0);
  if (input.config.simulationCount < 1 || totalWeight <= 0) {
    return {
      levelId: input.level.levelId,
      levelName: input.level.name,
      levelIndex: input.level.levelIndex,
      status: "invalid_level",
      metrics: {
        passRate: 0,
        failRate: 1,
        avgCompletionTime: 0,
        avgRemainingTime: 0,
        avgMoves: 0,
        avgSlotPressure: 0,
        maxSlotPressure: 0,
        targetCompletionRate: 0,
        targetStarvationTurnsAvg: 0,
        firstTargetFoundTimeAvg: 0,
        wastedMoveRatio: 0,
      },
      profileBreakdown: [],
      failReasons: [{ reason: "invalid_level", count: 1, ratio: 1 }],
      qaIssues: [{ code: "invalid_config", severity: "critical", title: "模拟配置非法", detail: "simulationCount 或 profile weight 非法" }],
      balanceSuggestions: [],
    };
  }
  const samples: PlayerRunResult[] = [];
  let sampleId = 0;
  for (const profile of input.config.playerProfiles) {
    const count = Math.max(1, Math.round(input.config.simulationCount * (profile.weight / totalWeight)));
    for (let i = 0; i < count; i += 1) {
      samples.push(
        simulatePlayerRun({
          level: input.level,
          profile,
          config: input.config,
          seed: `${input.seed ?? "playtest"}_${profile.id}_${sampleId++}`,
        }),
      );
    }
  }
  const metrics = aggregateSimulation(samples);
  const perProfile = input.config.playerProfiles.map((profile) => {
    const list = samples.filter((s) => s.profileId === profile.id);
    const pass = list.filter((x) => x.passed).length;
    const avg = (nums: number[]) => (nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0);
    const failMap = new Map<string, number>();
    list.filter((x) => !x.passed).forEach((x) => failMap.set(x.failReason ?? "simulation_error", (failMap.get(x.failReason ?? "simulation_error") ?? 0) + 1));
    const mainFail = [...failMap.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    return {
      profileId: profile.id,
      profileName: profile.name,
      passRate: list.length ? pass / list.length : 0,
      avgCompletionTime: avg(list.map((x) => x.completionTime ?? 0)),
      avgRemainingTime: avg(list.map((x) => x.remainingTime ?? 0)),
      avgMoves: avg(list.map((x) => x.moves)),
      mainFailReason: mainFail,
    };
  });
  const { qaIssues, balanceSuggestions } = evaluateQaRules({
    level: input.level,
    result: metrics,
    config: input.config,
  });
  return {
    levelId: input.level.levelId,
    levelName: input.level.name,
    levelIndex: input.level.levelIndex,
    status: qaIssues.some((x) => x.severity === "critical" || x.severity === "high") ? "needs_review" : "completed",
    metrics,
    profileBreakdown: perProfile,
    failReasons: metrics.failReasons,
    qaIssues,
    balanceSuggestions,
    rawSamples: input.includeRawSamples
      ? samples.map((s, idx) => ({
          sampleId: idx + 1,
          profileId: s.profileId,
          passed: s.passed,
          completionTime: s.completionTime,
          remainingTime: s.remainingTime,
          moves: s.moves,
          failReason: s.failReason,
          slotPressureAvg: s.slotPressureAvg,
        }))
      : undefined,
  };
}
