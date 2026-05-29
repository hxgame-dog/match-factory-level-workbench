import { z } from "zod";

const difficultyIntentSchema = z.enum(["easy", "normal", "hard", "expert"]);
const generatedItemRoleSchema = z.enum(["target", "distractor", "filler", "special"]);

const generatedItemSchema = z.object({
  sourceItemId: z.number().int().optional(),
  catalogItemId: z.string().optional(),
  name: z.string().min(1),
  displayName: z.string().optional(),
  category1: z.string().min(1),
  category2: z.string().optional(),
  color1: z.string().optional(),
  color2: z.string().optional(),
  shape: z.string().optional(),
  size: z.string().optional(),
  targetScale: z.number().optional(),
  role: generatedItemRoleSchema,
  count: z.number().int().positive(),
  isNew: z.boolean(),
  imagePrompt: z.string().min(1),
  reason: z.string().min(1),
  riskTags: z.array(z.string()).optional(),
});

/** 方案 A：AI 自由生成，不依赖道具库 */
export const generateItemsInputSchema = z.object({
  setName: z.string().min(1, "道具集名称不能为空"),
  description: z.string().min(1, "请填写生成描述"),
  categories: z.array(z.string().min(1)).min(1, "请至少选择一个物品类别"),
  itemCount: z.number().int().min(1).max(80),
});

export const generateItemsResultSchema = z.object({
  summary: z.string().min(1),
  warnings: z.array(z.string()).default([]),
  items: z.array(generatedItemSchema).min(1, "items 不能为空"),
});

export function createGenerateItemsResultSchema(itemCount: number, categories: string[]) {
  const categorySet = new Set(categories.map((c) => c.toLowerCase()));

  return generateItemsResultSchema.superRefine((result, ctx) => {
    const minItems = Math.max(1, Math.floor(itemCount * 0.75));
    const maxItems = Math.ceil(itemCount * 1.25);

    if (result.items.length < minItems) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `生成种类过少：期望约 ${itemCount} 种，实际 ${result.items.length} 种`,
      });
    }
    if (result.items.length > maxItems + 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `生成种类过多：期望约 ${itemCount} 种，实际 ${result.items.length} 种`,
      });
    }

    const uniqueNames = new Set(result.items.map((item) => item.name.toLowerCase())).size;
    if (uniqueNames < Math.min(itemCount, result.items.length) - 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "存在重复道具名称，请重试生成",
      });
    }

    result.items.forEach((item, index) => {
      if (!categorySet.has(item.category1.toLowerCase())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `第 ${index + 1} 项 category1「${item.category1}」不在所选类别内`,
        });
      }
    });
  });
}

export const generatedItemSetPayloadSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  categories: z.array(z.string().min(1)).min(1),
  itemCount: z.number().int().positive(),
  summary: z.string().optional(),
  warnings: z.array(z.string()).default([]),
  items: z.array(generatedItemSchema).min(1),
});

export const diagnoseLevelInputSchema = z.object({
  levelConfig: z.unknown(),
  items: z.array(z.unknown()),
  formulaConfig: z.unknown().optional(),
});

export const diagnoseLevelResultSchema = z.object({
  score: z.object({
    itemComplexity: z.number(),
    ruleDifficulty: z.number(),
    timePressure: z.number(),
    finalDifficulty: z.number(),
    difficultyLabel: z.string(),
  }),
  risks: z.array(z.string()),
  suggestions: z.array(z.string()),
  explanation: z.string(),
});

export const generateAssetPromptInputSchema = z.object({
  item: z.object({
    name: z.string().min(1),
    displayName: z.string().optional(),
    category1: z.string().min(1),
    category2: z.string().optional(),
    color1: z.string().optional(),
    color2: z.string().optional(),
    shape: z.string().optional(),
    size: z.string().optional(),
    role: z.string().optional(),
  }),
  globalArtStyle: z.string().min(1),
  negativePrompt: z.string().optional(),
});

export const generateAssetPromptResultSchema = z.object({
  prompt: z.string().min(30),
  negativePrompt: z.string().optional(),
  notes: z.string().optional(),
});

export const aiTestInputSchema = z.object({
  prompt: z.string().min(1).default("请返回一句简短问候"),
});

/** @deprecated 仅 Excel 导出元数据兼容 */
export { difficultyIntentSchema };
