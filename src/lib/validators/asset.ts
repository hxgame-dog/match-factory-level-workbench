import { z } from "zod";

export const assetStatusSchema = z.enum([
  "pending",
  "prompt_ready",
  "generating",
  "done",
  "failed",
  "skipped",
]);

const assetItemSchema = z.object({
  generatedItemId: z.string().optional(),
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
  role: z.string().optional(),
  count: z.number().int().optional(),
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
