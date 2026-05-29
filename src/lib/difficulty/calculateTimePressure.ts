import type { DifficultyFormulaConfig } from "@/types/difficulty";
import type { LevelConfig } from "@/types/level";

export function calculateTimePressure(level: LevelConfig, config: DifficultyFormulaConfig) {
  const baselineTime = config.constants.baselineTime;
  const timeLimitSec = level.rules.timeLimitSec;
  const rawT = baselineTime / Math.max(1, timeLimitSec);
  const clampedT = Math.min(config.constants.maxTimePressure, Math.max(config.constants.minTimePressure, rawT));
  const warnings: string[] = [];
  if (timeLimitSec < 120) warnings.push("时间限制偏低，时间压力较大");
  return { T: clampedT, rawT, clampedT, baselineTime, timeLimitSec, warnings };
}
