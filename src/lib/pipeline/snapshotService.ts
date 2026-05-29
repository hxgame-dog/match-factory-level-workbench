import { prisma } from "@/lib/prisma";
import { levelConfigSchema } from "@/lib/validators/level";

export async function createLevelSnapshot(levelId: string, snapshotName: string, note?: string) {
  const level = await prisma.generatedLevel.findUnique({ where: { id: levelId } });
  if (!level) throw new Error("关卡不存在");
  return prisma.levelSnapshot.create({
    data: {
      levelId: level.id,
      levelName: level.name,
      levelIndex: level.levelIndex,
      snapshotName,
      levelJson: level.levelJson,
      note,
    },
  });
}

export async function restoreLevelSnapshot(snapshotId: string) {
  const snapshot = await prisma.levelSnapshot.findUnique({ where: { id: snapshotId } });
  if (!snapshot) throw new Error("快照不存在");
  const level = levelConfigSchema.parse(JSON.parse(snapshot.levelJson));
  return prisma.generatedLevel.update({
    where: { id: snapshot.levelId },
    data: {
      levelJson: JSON.stringify(level),
      name: level.name,
      levelIndex: level.levelIndex,
      timeLimitSec: level.rules.timeLimitSec,
      slotCount: level.rules.slotCount,
      boardWidth: level.board.width,
      boardHeight: level.board.height,
      layerCount: level.board.layerCount,
      generatorRuleId: level.rules.generatorRuleId,
      refreshRuleId: level.rules.refreshRuleId,
      targetDifficulty: level.rules.targetDifficulty,
      status: "needs_review",
    },
  });
}

export async function compareLevelWithSnapshot(levelId: string, snapshotId: string) {
  const [levelRow, snapshot] = await Promise.all([
    prisma.generatedLevel.findUnique({ where: { id: levelId } }),
    prisma.levelSnapshot.findUnique({ where: { id: snapshotId } }),
  ]);
  if (!levelRow || !snapshot) throw new Error("关卡或快照不存在");
  const current = levelConfigSchema.parse(JSON.parse(levelRow.levelJson));
  const old = levelConfigSchema.parse(JSON.parse(snapshot.levelJson));
  return {
    levelId,
    snapshotId,
    targetDiff: current.targets.reduce((s, t) => s + t.count, 0) - old.targets.reduce((s, t) => s + t.count, 0),
    spawnDiff: current.spawns.reduce((s, t) => s + t.count, 0) - old.spawns.reduce((s, t) => s + t.count, 0),
    timeLimitDiff: current.rules.timeLimitSec - old.rules.timeLimitSec,
    generatorRuleChanged: current.rules.generatorRuleId !== old.rules.generatorRuleId,
    refreshRuleChanged: current.rules.refreshRuleId !== old.rules.refreshRuleId,
    jsonDiffPreview: `current length=${levelRow.levelJson.length}, snapshot length=${snapshot.levelJson.length}`,
  };
}

export async function listLevelSnapshots(levelId: string) {
  return prisma.levelSnapshot.findMany({ where: { levelId }, orderBy: { createdAt: "desc" } });
}
