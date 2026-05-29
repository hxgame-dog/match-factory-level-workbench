export type GenerateItemsInput = {
  setName: string;
  description: string;
  itemCount: number;
};

export type GenerateItemsResult = {
  summary: string;
  warnings: string[];
  items: Array<{
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
    targetScale?: number;
    role: "target" | "distractor" | "filler" | "special";
    count: number;
    isNew: boolean;
    imagePrompt: string;
    reason: string;
    riskTags?: string[];
  }>;
};

export type DiagnoseLevelInput = {
  levelConfig: unknown;
  items: unknown[];
  formulaConfig?: unknown;
};

export type DiagnoseLevelResult = {
  score: {
    itemComplexity: number;
    ruleDifficulty: number;
    timePressure: number;
    finalDifficulty: number;
    difficultyLabel: string;
  };
  risks: string[];
  suggestions: string[];
  explanation: string;
};

export type { GenerateAssetPromptInput, GenerateAssetPromptResult } from "@/types/asset";
