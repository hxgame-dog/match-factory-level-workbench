import type { LevelConfig } from "@/types/level";

export function buildRuntimeConfigPreview(levels: LevelConfig[]) {
  return {
    schemaVersion: 1,
    target: "runtime_config_preview",
    generatedAt: new Date().toISOString(),
    levels: levels.map((level) => ({
      levelId: level.levelId,
      levelIndex: level.levelIndex,
      rules: level.rules,
      board: level.board,
      targetCount: level.targets.reduce((s, t) => s + t.count, 0),
      spawnCount: level.spawns.reduce((s, t) => s + t.count, 0),
    })),
  };
}
