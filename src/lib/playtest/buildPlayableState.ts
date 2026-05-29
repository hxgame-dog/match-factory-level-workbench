import type { LevelConfig } from "@/types/level";
import type { PlayableState } from "@/types/playtest";

export function buildPlayableState(level: LevelConfig): PlayableState {
  const warnings: string[] = [];
  const targetsRemaining: Record<string, number> = {};
  level.targets.forEach((t) => {
    targetsRemaining[t.name] = (targetsRemaining[t.name] ?? 0) + t.count;
  });
  const spawnCountByName = new Map<string, number>();
  level.spawns.forEach((s) => spawnCountByName.set(s.name, (spawnCountByName.get(s.name) ?? 0) + s.count));
  Object.entries(targetsRemaining).forEach(([name, count]) => {
    if ((spawnCountByName.get(name) ?? 0) < count) {
      warnings.push(`target_insufficient:${name}`);
    }
  });
  const maxLayer = Math.max(1, level.board.layerCount || 1);
  const itemPool = level.spawns.flatMap((spawn) =>
    Array.from({ length: Math.max(0, spawn.count) }).map((_, i) => {
      const layer = i % maxLayer;
      return {
        instanceId: `${spawn.name}_${i}_${layer}`,
        name: spawn.name,
        role: spawn.role,
        category1: spawn.category1,
        color1: spawn.color1,
        shape: spawn.shape,
        size: spawn.size,
        layer,
        visible: layer === 0,
        collected: false,
        targetRequired: Boolean(targetsRemaining[spawn.name]),
      };
    }),
  );
  return {
    itemPool,
    targetsRemaining,
    slot: [],
    timeLimitSec: level.rules.timeLimitSec,
    warnings,
  };
}
