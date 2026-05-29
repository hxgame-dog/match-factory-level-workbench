import type { LevelConfig, LevelItemEntry } from "@/types/level";

type Cell = {
  x: number;
  y: number;
  layer: number;
  item?: LevelItemEntry;
  asset?: { imageUrl?: string; localPath?: string };
};

function seededSort<T>(arr: T[], seed: string) {
  const chars = [...seed].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return [...arr].sort(() => (chars % 2 === 0 ? 1 : -1));
}

export function buildBoardPreview(input: {
  level: LevelConfig;
  seed?: string;
  filter?: { role?: "target" | "distractor" | "filler" | "special"; layer?: number };
}): {
  cells: Cell[];
  stats: { capacity: number; used: number; overflow: number; empty: number };
  warnings: string[];
} {
  const { level } = input;
  const capacity = level.board.width * level.board.height * Math.max(1, level.board.layerCount);
  const items = level.spawns
    .flatMap((item) => Array.from({ length: item.count }).map(() => item))
    .filter((item) => (input.filter?.role ? item.role === input.filter.role : true));

  let instances = [...items];
  if (level.board.layoutMode === "clustered") {
    instances.sort((a, b) => `${a.category1}-${a.name}`.localeCompare(`${b.category1}-${b.name}`));
  } else if (level.board.layoutMode === "random") {
    instances = seededSort(instances, input.seed ?? "level-editor");
  } else if (level.board.layoutMode === "stacked") {
    instances.sort((a, b) => a.name.localeCompare(b.name));
  }

  const cells: Cell[] = [];
  for (let layer = 1; layer <= level.board.layerCount; layer += 1) {
    if (input.filter?.layer && input.filter.layer !== layer) continue;
    for (let y = 0; y < level.board.height; y += 1) {
      for (let x = 0; x < level.board.width; x += 1) {
        const index = cells.length;
        const item = instances[index];
        const asset = item?.assetKey ? level.assets[item.assetKey] : undefined;
        cells.push({ x, y, layer, item, asset });
      }
    }
  }

  const used = Math.min(instances.length, capacity);
  const overflow = Math.max(0, instances.length - capacity);
  const empty = Math.max(0, capacity - used);
  const warnings: string[] = [];
  if (overflow > 0) warnings.push(`预览溢出 ${overflow} 个实例`);
  if (used === 0) warnings.push("当前预览没有可显示的道具实例");

  return {
    cells,
    stats: { capacity, used, overflow, empty },
    warnings,
  };
}
