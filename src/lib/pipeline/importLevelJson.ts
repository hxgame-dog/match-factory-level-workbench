import { prisma } from "@/lib/prisma";
import { importLevelJsonSchema, importedLevelPayloadSchema } from "@/lib/validators/pipeline";
import type { ImportResult } from "@/types/pipeline";
import type { LevelConfig } from "@/types/level";

export async function importLevelJson(input: {
  fileContent: string;
  dryRun: boolean;
}): Promise<ImportResult> {
  const payload = importLevelJsonSchema.parse(input);
  let parsed: unknown;
  try {
    parsed = JSON.parse(payload.fileContent);
  } catch {
    return { success: false, summary: "JSON 解析失败", total: 1, passed: 0, failed: 1, items: [{ name: "unknown", status: "failed", error: "非法 JSON" }] };
  }
  const parsedLevel = importedLevelPayloadSchema.safeParse(parsed);
  if (!parsedLevel.success) {
    return {
      success: false,
      summary: "Schema 校验失败",
      total: 1,
      passed: 0,
      failed: 1,
      items: [{ name: "level", status: "failed", error: parsedLevel.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") }],
    };
  }
  const level = ("level" in parsedLevel.data ? parsedLevel.data.level : parsedLevel.data) as LevelConfig;
  if (!payload.dryRun) {
    const exists = level.levelIndex
      ? await prisma.generatedLevel.findFirst({ where: { levelIndex: level.levelIndex } })
      : null;
    const safeName = exists ? `${level.name} (import copy)` : level.name;
    await prisma.generatedLevel.create({
      data: {
        name: safeName,
        levelIndex: exists ? undefined : level.levelIndex,
        theme: level.theme,
        itemSetId: level.source.itemSetId,
        itemSetName: level.source.itemSetId,
        assetBatchId: level.source.assetBatchId,
        assetBatchName: level.source.assetBatchId,
        timeLimitSec: level.rules.timeLimitSec,
        slotCount: level.rules.slotCount,
        boardWidth: level.board.width,
        boardHeight: level.board.height,
        layerCount: level.board.layerCount,
        targetDifficulty: level.rules.targetDifficulty,
        generatorRuleId: level.rules.generatorRuleId,
        refreshRuleId: level.rules.refreshRuleId,
        levelJson: JSON.stringify(level),
        status: "needs_review",
      },
    });
  }
  return { success: true, summary: payload.dryRun ? "Dry Run 通过" : "导入成功", total: 1, passed: 1, failed: 0, items: [{ name: level.name, status: "ok", level }] };
}
