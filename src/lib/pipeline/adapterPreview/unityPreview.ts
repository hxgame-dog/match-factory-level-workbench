import type { LevelConfig } from "@/types/level";

export function buildUnityPreview(levels: LevelConfig[]) {
  return {
    schemaVersion: 1,
    target: "unity_preview",
    levels: levels.map((level) => ({
      levelIndex: level.levelIndex ?? 0,
      timeLimitSec: level.rules.timeLimitSec,
      slotCount: level.rules.slotCount,
      targets: level.targets.map((t) => ({
        itemId: t.sourceItemId ?? 0,
        name: t.name,
        count: t.count,
        asset: t.assetKey ? `assets/images/${t.assetKey}.svg` : undefined,
      })),
      spawns: level.spawns.map((s) => ({
        itemId: s.sourceItemId ?? 0,
        name: s.name,
        count: s.count,
        asset: s.assetKey ? `assets/images/${s.assetKey}.svg` : undefined,
      })),
    })),
  };
}
