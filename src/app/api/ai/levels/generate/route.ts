import { NextResponse } from "next/server";

import { generateLevelCandidates } from "@/lib/ai/gemini";
import { estimateBasicDifficulty } from "@/lib/level/estimateDifficulty";
import { generatorRulePresets, refreshRulePresets } from "@/lib/level/rulePresets";
import { validateLevelConfig } from "@/lib/level/validateLevelConfig";
import { prisma } from "@/lib/prisma";
import { generateLevelInputSchema, generateLevelResultSchema } from "@/lib/validators/level";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const reqInput = generateLevelInputSchema.parse(body);

    const itemSet = await prisma.generatedItemSet.findUnique({
      where: { id: reqInput.source.itemSetId },
      include: { items: true },
    });
    if (!itemSet) {
      return NextResponse.json({ success: false, error: "未找到 ItemSet" }, { status: 404 });
    }

    const batch = reqInput.source.assetBatchId
      ? await prisma.assetGenerationBatch.findUnique({
          where: { id: reqInput.source.assetBatchId },
          include: { assets: true },
        })
      : null;

    const generatorRule = generatorRulePresets.find((r) => r.id === reqInput.config.generatorRuleId);
    const refreshRule = refreshRulePresets.find((r) => r.id === reqInput.config.refreshRuleId);
    if (!generatorRule || !refreshRule) {
      return NextResponse.json({ success: false, error: "规则 preset 不存在" }, { status: 400 });
    }

    const aiInput = {
      ...reqInput,
      items: itemSet.items.map((item) => ({
        generatedItemId: item.id,
        sourceItemId: item.sourceItemId ?? undefined,
        catalogItemId: item.catalogItemId ?? undefined,
        name: item.name,
        displayName: item.displayName ?? undefined,
        category1: item.category1,
        category2: item.category2 ?? undefined,
        color1: item.color1 ?? undefined,
        color2: item.color2 ?? undefined,
        shape: item.shape ?? undefined,
        size: item.size ?? undefined,
        role: item.role as "target" | "distractor" | "filler" | "special",
        count: item.count,
      })),
      assets: batch?.assets.map((asset) => ({
        generatedItemId: asset.generatedItemId ?? undefined,
        name: asset.name,
        imageUrl: asset.imageUrl ?? undefined,
        localPath: asset.localPath ?? undefined,
        prompt: asset.prompt ?? undefined,
      })),
      rulePresets: { generatorRule, refreshRule },
    };

    const aiResult = await generateLevelCandidates(aiInput);
    const cleanedCandidates = aiResult.candidates.slice(0, reqInput.candidateCount);
    const normalized = cleanedCandidates.map((candidate) => {
      const validNames = new Set(aiInput.items.map((item) => item.name));
      const targets = candidate.targets.filter((item) => validNames.has(item.name) && item.role === "target");
      const spawns = candidate.spawns.filter((item) => validNames.has(item.name));
      const level = { ...candidate, targets, spawns };
      const validation = validateLevelConfig(level, aiInput.items);
      const difficulty = estimateBasicDifficulty({
        level,
        generatorRuleDifficulty: generatorRule.difficultyValue,
        refreshRuleDifficulty: refreshRule.difficultyValue,
      });
      return {
        ...level,
        diagnostics: {
          estimatedItemComplexity: difficulty.itemComplexity,
          estimatedRuleDifficulty: difficulty.ruleDifficulty,
          estimatedTimePressure: difficulty.timePressure,
          estimatedFinalDifficulty: difficulty.finalDifficulty,
          warnings: [...(level.diagnostics?.warnings ?? []), ...validation.warnings, ...difficulty.warnings],
          suggestions: [...(level.diagnostics?.suggestions ?? []), ...difficulty.suggestions],
        },
        _validation: validation,
      };
    });

    const validated = generateLevelResultSchema.parse({
      summary: aiResult.summary,
      warnings: aiResult.warnings,
      candidates: normalized,
    });
    return NextResponse.json({
      success: true,
      data: validated,
      validations: normalized.map((c) => c._validation),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "关卡候选生成失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
