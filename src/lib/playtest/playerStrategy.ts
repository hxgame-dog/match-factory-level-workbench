import type { PlayableItem, PlayableState, PlayerProfile, SimulatorConfig } from "@/types/playtest";
import { SeededRandom } from "./random";

function sizeScore(size?: string) {
  const s = (size ?? "").toLowerCase();
  if (s.includes("large")) return 1.2;
  if (s.includes("small")) return 0.8;
  return 1;
}

function chooseByScore(items: PlayableItem[], score: (item: PlayableItem) => number, rng: SeededRandom) {
  const scored = items.map((item) => ({ item, w: Math.max(0.01, score(item)) }));
  const total = scored.reduce((s, x) => s + x.w, 0);
  let r = rng.next() * total;
  for (const entry of scored) {
    r -= entry.w;
    if (r <= 0) return entry.item;
  }
  return scored[scored.length - 1]?.item;
}

export function chooseNextItem(input: {
  state: PlayableState;
  profile: PlayerProfile;
  config: SimulatorConfig;
  rng: SeededRandom;
}): {
  itemInstanceId?: string;
  reason: string;
  isMistake: boolean;
} {
  const { state, profile, config, rng } = input;
  const visible = state.itemPool.filter((i) => i.visible && !i.collected);
  if (!visible.length) return { reason: "no_visible_items", isMistake: false };
  const panic = state.slot.length / Math.max(1, config.rules.slotCapacity) > 0.75;
  const shouldMistake = rng.next() < profile.mistakeRate || (panic && rng.next() < profile.panicFactor);
  const targets = visible.filter((i) => (state.targetsRemaining[i.name] ?? 0) > 0);
  const distractors = visible.filter((i) => (state.targetsRemaining[i.name] ?? 0) <= 0);

  if (config.strategy.selectionStrategy === "panic_random" && panic) {
    const picked = rng.pick(visible);
    return { itemInstanceId: picked?.instanceId, reason: "panic_random", isMistake: true };
  }
  if (config.strategy.selectionStrategy === "target_first" && targets.length && !shouldMistake) {
    const picked = chooseByScore(targets, (item) => profile.targetPriority * sizeScore(item.size), rng);
    return { itemInstanceId: picked?.instanceId, reason: "target_first", isMistake: false };
  }
  if (config.strategy.selectionStrategy === "risk_aware") {
    const list = targets.length ? targets : visible;
    const picked = chooseByScore(list, (item) => {
      const isTarget = (state.targetsRemaining[item.name] ?? 0) > 0 ? 1.2 : 0.7;
      const slotRisk = 1 - state.slot.length / Math.max(1, config.rules.slotCapacity);
      return isTarget * (0.5 + slotRisk);
    }, rng);
    return { itemInstanceId: picked?.instanceId, reason: "risk_aware", isMistake: shouldMistake };
  }
  if (config.strategy.selectionStrategy === "visible_easy_first") {
    const list = targets.length ? targets : visible;
    const picked = chooseByScore(list, (item) => sizeScore(item.size) + (item.layer === 0 ? 0.5 : 0), rng);
    return { itemInstanceId: picked?.instanceId, reason: "visible_easy_first", isMistake: shouldMistake };
  }
  if (config.strategy.selectionStrategy === "random_weighted") {
    const picked = chooseByScore(visible, (item) => ((state.targetsRemaining[item.name] ?? 0) > 0 ? 1.2 : 0.8), rng);
    return { itemInstanceId: picked?.instanceId, reason: "random_weighted", isMistake: shouldMistake };
  }
  const pool = shouldMistake && distractors.length ? distractors : visible;
  const picked = rng.pick(pool);
  return { itemInstanceId: picked?.instanceId, reason: shouldMistake ? "mistake_click" : "fallback", isMistake: shouldMistake };
}
