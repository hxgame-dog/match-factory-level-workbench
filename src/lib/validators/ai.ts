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

export const generateItemsInputSchema = z.object({
  setName: z.string().min(1, "setName 不能为空"),
  theme: z.string().min(1, "theme 不能为空"),
  totalItemCount: z.number().int().positive(),
  targetTypeCount: z.number().int().positive(),
  targetCountEach: z.number().int().positive(),
  distractorTypeCount: z.number().int().min(0),
  difficultyIntent: difficultyIntentSchema,
  constraints: z.string().optional(),
  useExistingCatalogOnly: z.boolean().default(true),
  catalogSummary: z.object({
    total: z.number().int().nonnegative(),
    categories: z.array(z.object({ name: z.string(), count: z.number().int().nonnegative() })),
    colors: z.array(z.object({ name: z.string(), count: z.number().int().nonnegative() })),
    sizes: z.array(z.object({ name: z.string(), count: z.number().int().nonnegative() })),
  }),
  candidateItems: z
    .array(
      z.object({
        id: z.string(),
        itemId: z.number().int().optional(),
        name: z.string(),
        category1: z.string(),
        category2: z.string().optional(),
        color1: z.string().optional(),
        color2: z.string().optional(),
        shape: z.string().optional(),
        size: z.string().optional(),
        targetScale: z.number().optional(),
      }),
    )
    .max(150),
});

export const generateItemsResultSchema = z.object({
  summary: z.string().min(1),
  warnings: z.array(z.string()).default([]),
  items: z.array(generatedItemSchema).min(1, "items 不能为空"),
});

export function createGenerateItemsResultSchema(
  input: z.infer<typeof generateItemsInputSchema>,
  validCatalogIds: Set<string>,
) {
  return generateItemsResultSchema.superRefine((result, ctx) => {
    const targets = result.items.filter((item) => item.role === "target");
    const uniqueTargetTypes = new Set(targets.map((item) => item.name.toLowerCase())).size;
    if (uniqueTargetTypes < Math.max(1, input.targetTypeCount - 1)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "target 种类数与输入目标不匹配",
      });
    }
    targets.forEach((target, index) => {
      if (target.count !== input.targetCountEach) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `target 第 ${index + 1} 项 count 应为 ${input.targetCountEach}`,
        });
      }
    });

    if (input.useExistingCatalogOnly && result.items.some((item) => item.isNew)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "useExistingCatalogOnly=true 时不允许 isNew=true",
      });
    }

    for (const item of result.items) {
      if (item.catalogItemId && !validCatalogIds.has(item.catalogItemId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `catalogItemId 无效: ${item.catalogItemId}`,
        });
      }
    }
  });
}

export const generatedItemSetPayloadSchema = z.object({
  name: z.string().min(1),
  theme: z.string().min(1),
  prompt: z.string().min(1),
  totalItemCount: z.number().int().positive(),
  targetTypeCount: z.number().int().positive(),
  targetCountEach: z.number().int().positive(),
  distractorTypeCount: z.number().int().min(0),
  difficultyIntent: z.string().optional(),
  constraints: z.string().optional(),
  useExistingCatalogOnly: z.boolean().default(true),
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
