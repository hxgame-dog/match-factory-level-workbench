import type { DifficultyFormulaConfig } from "@/types/difficulty";

export const defaultFormulaConfig: DifficultyFormulaConfig = {
  complexityWeights: { Wtag: 0.35, Wsize: 0.15, Wqty: 0.15, Wtarget: 0.15, Wvisual: 0.2 },
  attrWeights: { category1: 1.0, category2: 0.8, color1: 1.4, color2: 0.6, shape: 1.2, size: 1.0 },
  bucketWeights: { high: 1.6, medium: 1.0, low: 0.5, none: 0.1 },
  sizeWeights: { small: 1.25, medium: 1.0, large: 0.75, unknown: 1.0 },
  targetWeights: { targetRatioWeight: 0.8, distractorRatioWeight: 1.2, targetTypeWeight: 1.0 },
  visualWeights: { colorWeight: 0.45, shapeWeight: 0.35, missingAssetWeight: 0.2 },
  ruleWeights: { generatorRuleWeight: 1.0, refreshRuleWeight: 1.0, layoutWeight: 0.6, layerWeight: 0.4 },
  constants: { baselineItemCount: 60, baselineTime: 180, K: 0.75, minTimePressure: 0.5, maxTimePressure: 2.0 },
  labelThresholds: { easyMax: 0.8, normalMax: 1.2, hardMax: 1.6 },
};

export const similarValues: Record<string, string[]> = {
  red: ["pink", "orange"],
  pink: ["red", "purple"],
  orange: ["red", "yellow"],
  yellow: ["orange", "brown"],
  blue: ["cyan", "purple"],
  green: ["cyan", "yellow"],
  black: ["gray", "dark"],
  white: ["gray", "light"],
  round: ["circle", "sphere", "ball"],
  square: ["box", "cube", "rectangle"],
  long: ["stick", "thin", "pencil"],
};
