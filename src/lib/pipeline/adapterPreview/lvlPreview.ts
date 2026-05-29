import type { LevelConfig } from "@/types/level";

export function buildLvlPreview(levels: LevelConfig[], difficulties: Map<string, number>) {
  return {
    schemaVersion: 1,
    target: "lvl_binary_export_preview",
    note: "This is not a real .lvl binary export. It maps LevelConfig fields to expected lvl-like sections for future implementation.",
    levels: levels.map((level) => ({
      levelIndex: level.levelIndex ?? 0,
      baseData: {
        boardWidth: level.board.width,
        boardHeight: level.board.height,
        layerCount: level.board.layerCount,
      },
      levelData: {
        timeLimitSec: level.rules.timeLimitSec,
        difficulty: difficulties.get(level.levelId) ?? 0,
        field6_collectGoals: level.targets.map((t) => ({ itemId: t.sourceItemId ?? 0, count: t.count })),
        field7_boardSpawns: level.spawns.map((s) => ({ itemId: s.sourceItemId ?? 0, count: s.count })),
      },
    })),
  };
}
