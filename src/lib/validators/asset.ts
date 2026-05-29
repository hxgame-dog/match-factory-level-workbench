import { z } from "zod";

const optStr = z.string().nullish().transform((v) => v ?? undefined);
const optInt = z.number().int().nullish().transform((v) => v ?? undefined);

export const assetStatusSchema = z.enum([
  "pending",
  "prompt_ready",
  "generating",
  "done",
  "failed",
  "skipped",
]);

const assetItemSchema = z.object({
  generatedItemId: optStr,
  sourceItemId: optInt,
  catalogItemId: optStr,
  name: z.string().min(1),
  displayName: optStr,
  category1: z.string().min(1),
  category2: optStr,
  color1: optStr,
  color2: optStr,
  shape: optStr,
  size: optStr,
  role: optStr,
  count: optInt,
  imagePrompt: optStr,
  reason: optStr,
});

export const generateAssetImageInputSchema = z.object({
  assetId: z.string().optional(),
  item: assetItemSchema,
  prompt: z.string().min(1),
  negativePrompt: z.string().optional(),
  provider: z.enum(["gemini", "mock"]).optional(),
  imageSize: z.enum(["512x512", "768x768", "1024x1024"]).default("512x512"),
  backgroundMode: z.enum(["transparent", "plain", "studio"]).default("plain"),
});

export const generateAssetBatchInputSchema = z.object({
  itemSetId: z.string().min(1),
  batchName: z.string().min(1),
  globalArtStyle: z.string().min(1),
  negativePrompt: z.string().optional(),
  imageSize: z.enum(["512x512", "768x768", "1024x1024"]).default("512x512"),
  backgroundMode: z.enum(["transparent", "plain", "studio"]).default("plain"),
});

export const updateAssetPromptSchema = z.object({
  prompt: z.string().min(1),
  negativePrompt: z.string().optional(),
});
