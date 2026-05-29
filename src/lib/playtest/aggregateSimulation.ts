import type { PlayerRunResult } from "@/types/playtest";

export function aggregateSimulation(samples: PlayerRunResult[]) {
  const total = Math.max(1, samples.length);
  const passed = samples.filter((s) => s.passed).length;
  const avg = (list: number[]) => (list.length ? list.reduce((a, b) => a + b, 0) / list.length : 0);
  const fails = new Map<string, number>();
  samples.forEach((s) => {
    if (!s.passed) fails.set(s.failReason ?? "simulation_error", (fails.get(s.failReason ?? "simulation_error") ?? 0) + 1);
  });
  return {
    passRate: passed / total,
    failRate: 1 - passed / total,
    avgCompletionTime: avg(samples.map((s) => s.completionTime ?? 0)),
    avgRemainingTime: avg(samples.map((s) => s.remainingTime ?? 0)),
    avgMoves: avg(samples.map((s) => s.moves)),
    avgSlotPressure: avg(samples.map((s) => s.slotPressureAvg)),
    maxSlotPressure: Math.max(0, ...samples.map((s) => s.slotPressureMax)),
    targetCompletionRate: passed / total,
    targetStarvationTurnsAvg: avg(samples.map((s) => s.targetStarvationTurns)),
    firstTargetFoundTimeAvg: avg(samples.map((s) => s.firstTargetFoundTime ?? 0)),
    wastedMoveRatio: avg(samples.map((s) => s.wastedMoveRatio)),
    failReasons: [...fails.entries()].map(([reason, count]) => ({
      reason: reason as "timeout" | "slot_full" | "target_not_found" | "target_insufficient" | "invalid_level" | "simulation_error",
      count,
      ratio: count / total,
    })),
  };
}
