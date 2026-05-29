import type { DifficultyFormulaConfig } from "@/types/difficulty";
import type { AutoGenerateLevelsInput, SourceLevelPatternAnalysis } from "@/types/autoLevel";

function labelByP(
  p: number,
  formulaConfig: DifficultyFormulaConfig,
): "easy" | "normal" | "hard" | "expert" {
  const t = formulaConfig.labelThresholds;
  if (p <= t.easyMax) return "easy";
  if (p <= t.normalMax) return "normal";
  if (p <= t.hardMax) return "hard";
  return "expert";
}

export function generateTargetCurve(input: {
  sourceAnalysis: SourceLevelPatternAnalysis;
  lastLevelIndex: number;
  generateCount: number;
  curveConfig: AutoGenerateLevelsInput["curveConfig"];
  formulaConfig: DifficultyFormulaConfig;
}) {
  const { sourceAnalysis, lastLevelIndex, generateCount, curveConfig, formulaConfig } = input;
  const minP = curveConfig.minP ?? 0.3;
  const maxP = curveConfig.maxP ?? 2.2;
  const base = sourceAnalysis.difficulty.maxP || sourceAnalysis.difficulty.avgP || 0.9;
  const out: Array<{ levelIndex: number; targetP: number; label: "easy" | "normal" | "hard" | "expert"; reason: string }> = [];

  for (let i = 1; i <= generateCount; i += 1) {
    const levelIndex = lastLevelIndex + i;
    let targetP = base;
    let reason = "base";
    if (curveConfig.curveType === "smooth_growth") {
      targetP = base + curveConfig.growthRate * i;
      reason = "平滑增长";
    } else if (curveConfig.curveType === "wave") {
      targetP = base + curveConfig.growthRate * i + Math.sin(i) * (curveConfig.waveAmplitude ?? 0.15);
      reason = "波浪节奏";
    } else if (curveConfig.curveType === "hard_every_5") {
      const interval = curveConfig.hardSpikeInterval ?? 5;
      const spike = curveConfig.hardSpikeStrength ?? 0.35;
      targetP = base + curveConfig.growthRate * i;
      if (i % interval === 0) targetP += spike;
      if ((i - 1) % interval === 0 && i > 1) targetP -= spike * 0.35;
      reason = "每隔固定关卡制造卡点";
    } else if (curveConfig.curveType === "plateau_then_rise") {
      const plateau = Math.ceil(generateCount * 0.4);
      targetP = i <= plateau ? base : base + curveConfig.growthRate * (i - plateau);
      reason = i <= plateau ? "前期平台" : "后期上升";
    } else if (curveConfig.curveType === "custom") {
      const custom = curveConfig.customTargets?.find((x) => x.levelIndex === levelIndex);
      targetP = custom?.targetP ?? base + curveConfig.growthRate * i;
      reason = custom ? "自定义目标" : "自定义缺失，按增长率补齐";
    }
    targetP = Math.max(minP, Math.min(maxP, targetP));
    out.push({ levelIndex, targetP, label: labelByP(targetP, formulaConfig), reason });
  }
  return out;
}
