import { NextResponse } from "next/server";
import { z } from "zod";

import { estimateBasicDifficulty } from "@/lib/level/estimateDifficulty";
import { generatorRulePresets, refreshRulePresets } from "@/lib/level/rulePresets";
import { validateLevelConfig } from "@/lib/level/validateLevelConfig";
import { levelConfigSchema } from "@/lib/validators/level";

const payloadSchema = z.object({
  level: levelConfigSchema,
  sourceItems: z.array(z.object({ name: z.string(), role: z.enum(["target", "distractor", "filler", "special"]) })),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = payloadSchema.parse(body);
    const validation = validateLevelConfig(payload.level, payload.sourceItems);
    const gRule = generatorRulePresets.find((rule) => rule.id === payload.level.rules.generatorRuleId);
    const rRule = refreshRulePresets.find((rule) => rule.id === payload.level.rules.refreshRuleId);
    const difficulty = estimateBasicDifficulty({
      level: payload.level,
      generatorRuleDifficulty: gRule?.difficultyValue ?? 1,
      refreshRuleDifficulty: rRule?.difficultyValue ?? 1,
    });
    return NextResponse.json({ success: true, validation, difficulty });
  } catch (error) {
    const message = error instanceof Error ? error.message : "校验失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
