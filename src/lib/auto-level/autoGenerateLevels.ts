import { prisma } from "@/lib/prisma";
import { generateAutoLevelCandidates } from "@/lib/ai/gemini";
import { buildLevelCandidates } from "@/lib/auto-level/buildLevelCandidates";
import { analyzeSourceLevels } from "@/lib/auto-level/analyzeSourceLevels";
import { generateTargetCurve } from "@/lib/auto-level/generateTargetCurve";
import { diagnoseLevelDifficulty } from "@/lib/difficulty/diagnoseLevelDifficulty";
import { defaultFormulaConfig } from "@/lib/difficulty/defaultFormulaConfig";
import { validateLevelConfig } from "@/lib/level/validateLevelConfig";
import { levelConfigSchema } from "@/lib/validators/level";
import type { AutoGenerateLevelsInput, AutoGenerateLevelsResult } from "@/types/autoLevel";
import type { LevelConfig, LevelItemEntry } from "@/types/level";

export async function autoGenerateLevels(input: AutoGenerateLevelsInput): Promise<AutoGenerateLevelsResult> {
  const sourceRows = await prisma.generatedLevel.findMany({
    where: { id: { in: input.sourceLevelIds } },
    orderBy: [{ levelIndex: "asc" }, { createdAt: "asc" }],
  });
  if (sourceRows.length === 0) throw new Error("未找到参考关卡");
  const sourceLevels = sourceRows.map((row) => levelConfigSchema.parse(JSON.parse(row.levelJson)));
  const formulaPreset = input.formulaPresetId
    ? await prisma.formulaPreset.findUnique({ where: { id: input.formulaPresetId } })
    : await prisma.formulaPreset.findFirst({ where: { isDefault: true } });
  const formulaConfig = formulaPreset?.configJson ? JSON.parse(formulaPreset.configJson) : defaultFormulaConfig;
  const sourceDiagnoses = sourceLevels.map((level) => diagnoseLevelDifficulty({ level, formulaConfig }));
  const sourceAnalysis = analyzeSourceLevels({ levels: sourceLevels, diagnoses: sourceDiagnoses });
  const lastLevelIndex =
    input.targetStartIndex ??
    Math.max(...sourceRows.map((row) => row.levelIndex ?? 0));
  const targetCurve = generateTargetCurve({
    sourceAnalysis,
    lastLevelIndex,
    generateCount: input.generateCount,
    curveConfig: input.curveConfig,
    formulaConfig,
  });

  const availableItemSets = await prisma.generatedItemSet.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
    select: { id: true, name: true, theme: true },
  });
  const availableItems: LevelItemEntry[] = sourceLevels.flatMap((level) => level.spawns);
  const availableAssetBatches = await prisma.assetGenerationBatch.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
    select: { id: true, itemSetId: true },
  });

  const run = await prisma.autoLevelGenerationRun.create({
    data: {
      name: input.name,
      description: input.description,
      sourceLevelIdsJson: JSON.stringify(input.sourceLevelIds),
      formulaPresetId: formulaPreset?.id,
      formulaPresetName: formulaPreset?.name,
      generateCount: input.generateCount,
      candidatesPerLevel: input.candidatesPerLevel,
      curveType: input.curveConfig.curveType,
      targetStartIndex: input.targetStartIndex,
      configJson: JSON.stringify(input),
      status: "generating",
    },
  });

  const generated: AutoGenerateLevelsResult["generated"] = [];
  const warnings: string[] = [];
  let failedTargets = 0;

  for (const target of targetCurve) {
    try {
      const localCandidates = await buildLevelCandidates({
        target,
        sourceLevels,
        sourceAnalysis,
        availableItemSets,
        availableItems,
        availableAssetBatches,
        constraints: input.generationConstraints,
        candidatesPerLevel: input.candidatesPerLevel * 2,
        formulaConfig,
      });
      const gemini = await generateAutoLevelCandidates({
        request: input,
        sourceAnalysis,
        target,
        sourceLevels,
        availableItems,
      });
      if (gemini.warnings.length) warnings.push(...gemini.warnings);
      const merged = [...localCandidates, ...gemini.candidates];
      const dedup = new Map<string, LevelConfig>();
      merged.forEach((level) => dedup.set(JSON.stringify(level), level));

      const scored = [...dedup.values()].map((level) => {
        const valid = validateLevelConfig(
          level,
          availableItems.map((item) => ({ id: item.generatedItemId ?? item.catalogItemId, name: item.name, role: item.role })),
        );
        const diagnosis = diagnoseLevelDifficulty({ level, formulaConfig });
        return {
          level,
          diagnosis,
          validation: valid,
          actualP: diagnosis.score.P,
          distance: Math.abs(diagnosis.score.P - target.targetP),
          status: valid.errors.length ? ("failed" as const) : valid.warnings.length ? ("needs_review" as const) : ("candidate" as const),
          warnings: [...valid.warnings],
        };
      });
      scored.sort((a, b) => a.distance - b.distance);
      const top = scored.slice(0, input.candidatesPerLevel);
      const rows = [];
      for (let idx = 0; idx < top.length; idx += 1) {
        const c = top[idx];
        const candidate = await prisma.autoGeneratedLevelCandidate.create({
          data: {
            runId: run.id,
            targetLevelIndex: target.levelIndex,
            candidateRank: idx + 1,
            targetP: target.targetP,
            actualP: c.actualP,
            distance: c.distance,
            levelName: c.level.name,
            levelJson: JSON.stringify(c.level),
            diagnosisJson: JSON.stringify(c.diagnosis),
            validationJson: JSON.stringify(c.validation),
            aiReason: gemini.reason,
            status: c.status,
          },
        });
        rows.push({
          candidateId: candidate.id,
          candidateRank: idx + 1,
          actualP: c.actualP,
          distance: c.distance,
          level: c.level,
          diagnosis: c.diagnosis,
          validation: c.validation,
          aiReason: gemini.reason,
          warnings: c.warnings,
          status: c.status,
        });
      }
      generated.push({ targetLevelIndex: target.levelIndex, targetP: target.targetP, candidates: rows });
    } catch (error) {
      failedTargets += 1;
      const message = error instanceof Error ? error.message : `目标关卡 ${target.levelIndex} 生成失败`;
      warnings.push(message);
      await prisma.autoGeneratedLevelCandidate.create({
        data: {
          runId: run.id,
          targetLevelIndex: target.levelIndex,
          candidateRank: 1,
          targetP: target.targetP,
          levelName: `L${target.levelIndex} failed`,
          levelJson: "{}",
          status: "failed",
          aiReason: message,
        },
      });
      generated.push({ targetLevelIndex: target.levelIndex, targetP: target.targetP, candidates: [] });
    }
  }

  const result: AutoGenerateLevelsResult = {
    runId: run.id,
    summary: `共生成 ${targetCurve.length} 个目标关卡，失败 ${failedTargets} 个`,
    warnings,
    sourceAnalysis,
    targetCurve,
    generated,
  };
  await prisma.autoLevelGenerationRun.update({
    where: { id: run.id },
    data: {
      status: failedTargets === 0 ? "completed" : failedTargets === targetCurve.length ? "failed" : "partial_failed",
      resultJson: JSON.stringify(result),
    },
  });
  return result;
}
