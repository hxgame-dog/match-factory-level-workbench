import type { LevelConfig } from "@/types/level";

type SourceItem = { id?: string; name: string; role: "target" | "distractor" | "filler" | "special" };

export function validateLevelConfig(level: LevelConfig, sourceItems: SourceItem[]) {
  const errors: string[] = [];
  const warnings: string[] = [];
  const sourceNames = new Set(sourceItems.map((item) => item.name));

  if (level.targets.length === 0) errors.push("targets 不能为空");
  if (level.spawns.length === 0) errors.push("spawns 不能为空");
  level.targets.forEach((item) => {
    if (!sourceNames.has(item.name)) errors.push(`target 道具不存在于 sourceItems: ${item.name}`);
    if (item.count <= 0) errors.push(`target count 非法: ${item.name}`);
    if (item.role !== "target") errors.push(`target role 必须为 target: ${item.name}`);
  });
  level.spawns.forEach((item) => {
    if (!sourceNames.has(item.name)) errors.push(`spawn 道具不存在于 sourceItems: ${item.name}`);
    if (item.count <= 0) errors.push(`spawn count 非法: ${item.name}`);
  });

  const targetTotal = level.targets.reduce((sum, item) => sum + item.count, 0);
  const spawnTotal = level.spawns.reduce((sum, item) => sum + item.count, 0);
  if (spawnTotal < targetTotal) warnings.push("spawn 总数小于 target 总数，可能无解");
  if (spawnTotal < 30) warnings.push("spawn 总量偏低");
  if (spawnTotal > 220) warnings.push("spawn 总量偏高");
  if (level.rules.timeLimitSec < 90) warnings.push("timeLimitSec 过低");
  if (level.rules.slotCount < 5) warnings.push("slotCount 小于 5");

  const missingAssetCount = level.spawns.filter((item) => item.assetKey && !level.assets[item.assetKey]).length;
  if (missingAssetCount > 0) warnings.push(`存在 ${missingAssetCount} 个道具缺少资源映射`);

  const colorShapeKeyCount = new Map<string, number>();
  level.spawns.forEach((item) => {
    const key = `${item.color1 ?? "_"}-${item.shape ?? "_"}`;
    colorShapeKeyCount.set(key, (colorShapeKeyCount.get(key) ?? 0) + 1);
  });
  if ([...colorShapeKeyCount.values()].some((count) => count >= 4)) {
    warnings.push("同色同形道具较多，可能产生识别压力");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    stats: {
      targetTypeCount: new Set(level.targets.map((item) => item.name)).size,
      targetTotalCount: targetTotal,
      spawnTypeCount: new Set(level.spawns.map((item) => item.name)).size,
      spawnTotalCount: spawnTotal,
      distractorTypeCount: new Set(level.spawns.filter((item) => item.role === "distractor").map((item) => item.name)).size,
      missingAssetCount,
    },
  };
}
