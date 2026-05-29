import { NextResponse } from "next/server";
import { z } from "zod";

import { estimateBasicDifficulty } from "@/lib/level/estimateDifficulty";
import { generatorRulePresets, refreshRulePresets } from "@/lib/level/rulePresets";
import { validateLevelConfig } from "@/lib/level/validateLevelConfig";
import { prisma } from "@/lib/prisma";
import { levelConfigSchema } from "@/lib/validators/level";

const payloadSchema = z.object({
  level: levelConfigSchema,
});

type Params = { params: Promise<{ levelId: string }> };

export async function PUT(request: Request, { params }: Params) {
  try {
    const { levelId } = await params;
    const body = await request.json();
    const payload = payloadSchema.parse(body);

    const itemSet = await prisma.generatedItemSet.findUnique({
      where: { id: payload.level.source.itemSetId },
      include: { items: true },
    });
    const validation = validateLevelConfig(
      payload.level,
      (itemSet?.items ?? []).map((item) => ({
        id: item.id,
        name: item.name,
        role: item.role as "target" | "distractor" | "filler" | "special",
      })),
    );
    const gRule = generatorRulePresets.find((rule) => rule.id === payload.level.rules.generatorRuleId);
    const rRule = refreshRulePresets.find((rule) => rule.id === payload.level.rules.refreshRuleId);
    const difficulty = estimateBasicDifficulty({
      level: payload.level,
      generatorRuleDifficulty: gRule?.difficultyValue ?? 1,
      refreshRuleDifficulty: rRule?.difficultyValue ?? 1,
    });
    const enhancedLevel = {
      ...payload.level,
      diagnostics: {
        ...(payload.level.diagnostics ?? {}),
        estimatedItemComplexity: difficulty.itemComplexity,
        estimatedRuleDifficulty: difficulty.ruleDifficulty,
        estimatedTimePressure: difficulty.timePressure,
        estimatedFinalDifficulty: difficulty.finalDifficulty,
        warnings: [...(payload.level.diagnostics?.warnings ?? []), ...validation.warnings, ...difficulty.warnings],
        suggestions: [...(payload.level.diagnostics?.suggestions ?? []), ...difficulty.suggestions],
      },
    };

    const status = validation.errors.length === 0 ? (validation.warnings.length === 0 ? "validated" : "needs_review") : "needs_review";
    const updated = await prisma.generatedLevel.update({
      where: { id: levelId },
      data: {
        name: enhancedLevel.name,
        levelIndex: enhancedLevel.levelIndex,
        theme: enhancedLevel.theme,
        timeLimitSec: enhancedLevel.rules.timeLimitSec,
        slotCount: enhancedLevel.rules.slotCount,
        boardWidth: enhancedLevel.board.width,
        boardHeight: enhancedLevel.board.height,
        layerCount: enhancedLevel.board.layerCount,
        targetDifficulty: enhancedLevel.rules.targetDifficulty,
        generatorRuleId: enhancedLevel.rules.generatorRuleId,
        refreshRuleId: enhancedLevel.rules.refreshRuleId,
        levelJson: JSON.stringify(enhancedLevel),
        validationJson: JSON.stringify(validation),
        warningsJson: JSON.stringify(enhancedLevel.diagnostics?.warnings ?? []),
        status,
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      validation,
      difficulty,
      level: enhancedLevel,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "保存失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
