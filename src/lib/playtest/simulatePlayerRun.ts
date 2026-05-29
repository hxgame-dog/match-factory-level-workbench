import type { LevelConfig } from "@/types/level";
import type { PlayerRunResult, SimulatorConfig, PlayerProfile } from "@/types/playtest";
import { buildPlayableState } from "./buildPlayableState";
import { chooseNextItem } from "./playerStrategy";
import { SeededRandom } from "./random";

export function simulatePlayerRun(input: {
  level: LevelConfig;
  profile: PlayerProfile;
  config: SimulatorConfig;
  seed: string;
}): PlayerRunResult {
  const rng = new SeededRandom(input.seed);
  const state = buildPlayableState(input.level);
  const capacity = input.level.rules.slotCount || input.config.rules.slotCapacity;
  const matchCount = input.config.rules.matchRequiredCount;
  let timeUsed = 0;
  let moves = 0;
  const slotPressure: number[] = [];
  let wastedMoves = 0;
  let targetFoundAt: number | undefined;
  let starvation = 0;
  if (state.warnings.some((w) => w.startsWith("target_insufficient"))) {
    return {
      profileId: input.profile.id,
      profileName: input.profile.name,
      passed: false,
      moves: 0,
      failReason: "target_insufficient",
      slotPressureAvg: 0,
      slotPressureMax: 0,
      targetStarvationTurns: 0,
      wastedMoveRatio: 0,
    };
  }

  while (timeUsed < (input.config.rules.timeLimitSecOverride ?? state.timeLimitSec)) {
    const remainingTargetTotal = Object.values(state.targetsRemaining).reduce((s, x) => s + Math.max(0, x), 0);
    if (remainingTargetTotal <= 0) {
      return {
        profileId: input.profile.id,
        profileName: input.profile.name,
        passed: true,
        completionTime: timeUsed,
        remainingTime: (input.config.rules.timeLimitSecOverride ?? state.timeLimitSec) - timeUsed,
        moves,
        slotPressureAvg: slotPressure.length ? slotPressure.reduce((a, b) => a + b, 0) / slotPressure.length : 0,
        slotPressureMax: slotPressure.length ? Math.max(...slotPressure) : 0,
        targetStarvationTurns: starvation,
        firstTargetFoundTime: targetFoundAt,
        wastedMoveRatio: moves ? wastedMoves / moves : 0,
      };
    }
    const decision = chooseNextItem({ state, profile: input.profile, config: input.config, rng });
    if (!decision.itemInstanceId) {
      return {
        profileId: input.profile.id,
        profileName: input.profile.name,
        passed: false,
        moves,
        failReason: "target_not_found",
        slotPressureAvg: slotPressure.length ? slotPressure.reduce((a, b) => a + b, 0) / slotPressure.length : 0,
        slotPressureMax: slotPressure.length ? Math.max(...slotPressure) : 0,
        targetStarvationTurns: starvation + 1,
        wastedMoveRatio: moves ? wastedMoves / moves : 0,
      };
    }
    const picked = state.itemPool.find((i) => i.instanceId === decision.itemInstanceId && !i.collected);
    if (!picked) {
      wastedMoves += 1;
      timeUsed += 1.2;
      continue;
    }
    picked.collected = true;
    moves += 1;
    const scanBase = 1.2 + (picked.size === "small" ? 0.4 : 0) + (decision.isMistake ? 0.3 : 0);
    timeUsed += scanBase / Math.max(0.3, input.profile.scanSpeed);
    state.slot.push(picked.name);
    slotPressure.push(Math.min(1, state.slot.length / capacity));
    const remainingNow = state.targetsRemaining[picked.name] ?? 0;
    if (remainingNow > 0) {
      state.targetsRemaining[picked.name] = remainingNow - 1;
      if (targetFoundAt === undefined) targetFoundAt = timeUsed;
      starvation = 0;
    } else {
      wastedMoves += 1;
      starvation += 1;
    }
    const sameCount = state.slot.filter((x) => x === picked.name).length;
    if (sameCount >= matchCount) {
      let removed = 0;
      state.slot = state.slot.filter((x) => {
        if (x === picked.name && removed < matchCount) {
          removed += 1;
          return false;
        }
        return true;
      });
    }
    if (state.slot.length >= capacity && !state.slot.some((name) => state.slot.filter((n) => n === name).length >= matchCount)) {
      return {
        profileId: input.profile.id,
        profileName: input.profile.name,
        passed: false,
        completionTime: timeUsed,
        remainingTime: Math.max(0, (input.config.rules.timeLimitSecOverride ?? state.timeLimitSec) - timeUsed),
        moves,
        failReason: "slot_full",
        slotPressureAvg: slotPressure.length ? slotPressure.reduce((a, b) => a + b, 0) / slotPressure.length : 0,
        slotPressureMax: 1,
        targetStarvationTurns: starvation,
        firstTargetFoundTime: targetFoundAt,
        wastedMoveRatio: moves ? wastedMoves / moves : 0,
      };
    }
  }
  return {
    profileId: input.profile.id,
    profileName: input.profile.name,
    passed: false,
    completionTime: timeUsed,
    remainingTime: 0,
    moves,
    failReason: "timeout",
    slotPressureAvg: slotPressure.length ? slotPressure.reduce((a, b) => a + b, 0) / slotPressure.length : 0,
    slotPressureMax: slotPressure.length ? Math.max(...slotPressure) : 0,
    targetStarvationTurns: starvation,
    firstTargetFoundTime: targetFoundAt,
    wastedMoveRatio: moves ? wastedMoves / moves : 0,
  };
}
