import type { DifficultyFormulaConfig } from "@/types/difficulty";
import type { LevelConfig } from "@/types/level";

const layoutDifficultyMap: Record<LevelConfig["board"]["layoutMode"], number> = {
  flat: 0.8,
  random: 1.0,
  clustered: 1.15,
  stacked: 1.3,
};

export function calculateRuleDifficulty(level: LevelConfig, config: DifficultyFormulaConfig) {
  const generatorRuleDifficulty = 1;
  const refreshRuleDifficulty = 1;
  const layoutDifficulty = layoutDifficultyMap[level.board.layoutMode];
  const layerDifficulty = Math.min(1.5, 0.8 + level.board.layerCount * 0.15);
  const S =
    generatorRuleDifficulty * config.ruleWeights.generatorRuleWeight +
    refreshRuleDifficulty * config.ruleWeights.refreshRuleWeight +
    layoutDifficulty * config.ruleWeights.layoutWeight +
    layerDifficulty * config.ruleWeights.layerWeight;
  const K = config.constants.K;
  const D = 1 + (2 / Math.PI) * Math.atan(K * S);
  const warnings: string[] = [];
  if (level.board.layerCount >= 4) warnings.push("层数较高，规则复杂度上升");
  return { D, S, details: { generatorRuleDifficulty, refreshRuleDifficulty, layoutDifficulty, layerDifficulty }, warnings };
}
