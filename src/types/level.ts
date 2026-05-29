export type LevelItemEntry = {
  generatedItemId?: string;
  sourceItemId?: number;
  catalogItemId?: string;
  name: string;
  displayName?: string;
  category1: string;
  category2?: string;
  color1?: string;
  color2?: string;
  shape?: string;
  size?: string;
  role: "target" | "distractor" | "filler" | "special";
  count: number;
  assetKey?: string;
};

export type LevelConfig = {
  levelId: string;
  levelIndex?: number;
  name: string;
  theme?: string;
  source: {
    itemSetId: string;
    assetBatchId?: string;
    generatedBy: "gemini" | "mock" | "manual";
  };
  meta: {
    version: number;
    createdAt: string;
    updatedAt?: string;
    notes?: string;
  };
  rules: {
    generatorRuleId: string;
    refreshRuleId: string;
    timeLimitSec: number;
    slotCount: number;
    targetDifficulty: "easy" | "normal" | "hard" | "expert";
  };
  board: {
    width: number;
    height: number;
    layerCount: number;
    layoutMode: "flat" | "stacked" | "clustered" | "random";
  };
  targets: LevelItemEntry[];
  spawns: LevelItemEntry[];
  assets: Record<
    string,
    {
      imageUrl?: string;
      localPath?: string;
      prompt?: string;
    }
  >;
  diagnostics?: {
    estimatedItemComplexity?: number;
    estimatedRuleDifficulty?: number;
    estimatedTimePressure?: number;
    estimatedFinalDifficulty?: number;
    warnings?: string[];
    suggestions?: string[];
  };
};

export type GenerateLevelInput = {
  levelName: string;
  levelIndex?: number;
  targetDifficulty: "easy" | "normal" | "hard" | "expert";
  candidateCount: number;
  source: {
    itemSetId: string;
    assetBatchId?: string;
  };
  config: {
    timeLimitSec: number;
    slotCount: number;
    boardWidth: number;
    boardHeight: number;
    layerCount: number;
    layoutMode: "flat" | "stacked" | "clustered" | "random";
    generatorRuleId: string;
    refreshRuleId: string;
  };
  items: Array<{
    generatedItemId?: string;
    sourceItemId?: number;
    catalogItemId?: string;
    name: string;
    displayName?: string;
    category1: string;
    category2?: string;
    color1?: string;
    color2?: string;
    shape?: string;
    size?: string;
    role: "target" | "distractor" | "filler" | "special";
    count: number;
  }>;
  assets?: Array<{
    generatedItemId?: string;
    name: string;
    imageUrl?: string;
    localPath?: string;
    prompt?: string;
  }>;
  rulePresets: {
    generatorRule: {
      id: string;
      name: string;
      difficultyValue: number;
      description: string;
    };
    refreshRule: {
      id: string;
      name: string;
      difficultyValue: number;
      description: string;
    };
  };
};

export type GenerateLevelResult = {
  summary: string;
  warnings: string[];
  candidates: LevelConfig[];
};
