import type { DifficultyDiagnosisResult, DifficultyFormulaConfig } from "@/types/difficulty";
import type { LevelConfig } from "@/types/level";

import { calculateItemComplexity } from "./calculateItemComplexity";
import { calculateRuleDifficulty } from "./calculateRuleDifficulty";
import { calculateTimePressure } from "./calculateTimePressure";

export function diagnoseLevelDifficulty(input: {
  level: LevelConfig;
  formulaConfig: DifficultyFormulaConfig;
}): DifficultyDiagnosisResult {
  const { level, formulaConfig } = input;
  const item = calculateItemComplexity(level, formulaConfig);
  const rule = calculateRuleDifficulty(level, formulaConfig);
  const time = calculateTimePressure(level, formulaConfig);
  const P = item.normalizedM * rule.D * time.T;
  const label =
    P <= formulaConfig.labelThresholds.easyMax
      ? "easy"
      : P <= formulaConfig.labelThresholds.normalMax
        ? "normal"
        : P <= formulaConfig.labelThresholds.hardMax
          ? "hard"
          : "expert";
  const confidence = Math.max(0.4, Math.min(0.98, 0.7 + Math.min(0.2, item.similarity.totalPairs / 200)));
  return {
    levelId: level.levelId,
    levelName: level.name,
    score: {
      M: item.M,
      normalizedM: item.normalizedM,
      D: rule.D,
      T: time.T,
      P,
      label,
      confidence,
    },
    breakdown: {
      itemComplexity: item.components,
      similarity: item.similarity,
      distribution: item.distribution,
      ruleDifficulty: {
        generatorRuleDifficulty: rule.details.generatorRuleDifficulty,
        refreshRuleDifficulty: rule.details.refreshRuleDifficulty,
        layoutDifficulty: rule.details.layoutDifficulty,
        layerDifficulty: rule.details.layerDifficulty,
        S: rule.S,
        K: formulaConfig.constants.K,
        D: rule.D,
      },
      timePressure: {
        baselineTime: time.baselineTime,
        timeLimitSec: time.timeLimitSec,
        rawT: time.rawT,
        clampedT: time.clampedT,
      },
    },
    warnings: [...item.warnings, ...rule.warnings, ...time.warnings],
    suggestions: [...item.suggestions],
  };
}
