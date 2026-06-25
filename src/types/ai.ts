export type GenerateItemsInput = {
  setName: string;
  description: string;
  /** 物品种类数（基础造型种类） */
  itemTypeCount: number;
  /** 每种造型对应的颜色变体数（0=不展开，使用各物种常规主色 color1） */
  colorCount: number;
};

export type GenerateItemsResult = {
  summary: string;
  warnings: string[];
  items: Array<{
    /** 道具表内序号，从 1 开始 */
    itemId?: number;
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
    /** 花纹：纯色、纵纹、斑点等 */
    pattern?: string;
    targetScale?: number;
    /** 移动速度档位 1–5（很慢 → 很快） */
    moveSpeed?: number;
    role?: "target" | "distractor" | "filler" | "special";
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
