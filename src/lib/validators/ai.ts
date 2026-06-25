import { z } from "zod";

import { STANDARD_COLOR_PALETTE } from "@/lib/items/colorPalette";
import {
  MAX_ITEM_TYPES,
  MAX_TOTAL_ROWS,
  usesColorExpansion,
} from "@/lib/items/itemGenerationLimits";

const difficultyIntentSchema = z.enum(["easy", "normal", "hard", "expert"]);
const generatedItemRoleSchema = z.enum(["target", "distractor", "filler", "special"]);

const generatedItemSchema = z.object({
  itemId: z.number().int().positive().optional(),
  sourceItemId: z
    .number()
    .int()
    .nullish()
    .transform((v) => v ?? undefined),
  catalogItemId: z
    .string()
    .nullish()
    .transform((v) => v ?? undefined),
  name: z.string().min(1),
  displayName: z.string().optional(),
  category1: z.string().min(1),
  category2: z.string().optional(),
  color1: z.string().optional(),
  color2: z.string().optional(),
  shape: z.string().optional(),
  size: z.string().optional(),
  pattern: z.string().optional(),
  targetScale: z.number().optional(),
  moveSpeed: z.number().int().min(1).max(5).default(3),
  role: generatedItemRoleSchema.default("target"),
  count: z.number().int().positive().default(9),
  isNew: z.boolean(),
  imagePrompt: z.string().min(1),
  reason: z.string().min(1),
  riskTags: z.array(z.string()).optional(),
});

export const generateItemsInputSchema = z
  .object({
    setName: z.string().min(1, "道具集名称不能为空"),
    description: z.string().min(1, "请填写生成描述"),
    itemTypeCount: z.number().int().min(1).max(MAX_ITEM_TYPES),
    colorCount: z
      .number()
      .int()
      .min(0)
      .max(STANDARD_COLOR_PALETTE.length),
  })
  .superRefine((data, ctx) => {
    if (data.colorCount === 0) return;
    const total = data.itemTypeCount * data.colorCount;
    if (total > MAX_TOTAL_ROWS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `物品种类数 × 颜色数量不能超过 ${MAX_TOTAL_ROWS} 条（当前 ${total}）`,
      });
    }
  });

export const generateItemsResultSchema = z.object({
  summary: z.string().min(1),
  warnings: z.array(z.string()).default([]),
  items: z.array(generatedItemSchema).min(1, "items 不能为空"),
});

export function createGenerateItemsResultSchema(
  expectedTotal: number,
  itemTypeCount: number,
  colorCount: number,
) {
  return generateItemsResultSchema.superRefine((result, ctx) => {
    const ratio = expectedTotal > 200 ? 0.25 : 0.65;
    const minTotal = Math.max(1, Math.floor(expectedTotal * ratio));
    const maxTotal = Math.ceil(expectedTotal * 1.15) + Math.max(itemTypeCount, 8);

    if (result.items.length < minTotal) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: usesColorExpansion(colorCount)
          ? `生成条数过少：期望约 ${expectedTotal} 条（${itemTypeCount} 种 × ${colorCount} 色），实际 ${result.items.length} 条`
          : `生成条数过少：期望约 ${expectedTotal} 种，实际 ${result.items.length} 条`,
      });
    }
    if (result.items.length > maxTotal) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `生成条数过多：期望约 ${expectedTotal} 条，实际 ${result.items.length} 条`,
      });
    }

    if (usesColorExpansion(colorCount)) {
      const colorKeys = STANDARD_COLOR_PALETTE.map((c) => c.key);
      const baseKeys = new Set(
        result.items.map((item) => {
          for (const key of colorKeys) {
            if (item.name.endsWith(`_${key}`)) {
              return item.name.slice(0, -(key.length + 1));
            }
          }
          return item.name;
        }),
      );
      const baseRatio = itemTypeCount > 50 ? 0.25 : 0.65;
      const minBases = Math.max(1, Math.floor(itemTypeCount * baseRatio));
      if (baseKeys.size < minBases) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `物品种类不足：期望约 ${itemTypeCount} 种基础造型，实际约 ${baseKeys.size} 种`,
        });
      }
    } else {
      const minTypes = Math.max(1, Math.floor(itemTypeCount * (itemTypeCount > 200 ? 0.25 : 0.65)));
      if (result.items.length < minTypes) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `物品种类不足：期望约 ${itemTypeCount} 种，实际 ${result.items.length} 种`,
        });
      }
      const missingColor = result.items.filter((i) => !i.color1?.trim()).length;
      if (missingColor > result.items.length * 0.2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `有 ${missingColor} 条缺少常规主色 color1，请重试或手动补全`,
        });
      }
    }
  });
}

export const generatedItemSetPayloadSchema = z
  .object({
    name: z.string().min(1),
    description: z.string().min(1),
    itemTypeCount: z.number().int().positive().max(MAX_ITEM_TYPES),
    colorCount: z.number().int().min(0).max(STANDARD_COLOR_PALETTE.length),
    summary: z.string().optional(),
    warnings: z.array(z.string()).default([]),
    items: z.array(generatedItemSchema).min(1),
  })
  .superRefine((data, ctx) => {
    if (data.colorCount === 0) return;
    const total = data.itemTypeCount * data.colorCount;
    if (total > MAX_TOTAL_ROWS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `物品种类数 × 颜色数量不能超过 ${MAX_TOTAL_ROWS} 条`,
      });
    }
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
    pattern: z.string().optional(),
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

export { difficultyIntentSchema };
