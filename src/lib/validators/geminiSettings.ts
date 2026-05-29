import { z } from "zod";

export const geminiSettingsUpdateSchema = z.object({
  apiKey: z.string().min(10).optional(),
  clearKey: z.boolean().optional(),
  textModel: z.string().min(1).optional(),
  imageModel: z.string().min(1).optional(),
});

export const geminiModelsRequestSchema = z.object({
  /** 仅用于一次性验证；保存后应依赖 HttpOnly Cookie，勿在前端持久化 */
  apiKey: z.string().min(10).optional(),
});

export const geminiTestSchema = z.object({
  prompt: z.string().min(1).default("Hello"),
  textModel: z.string().min(1).optional(),
  apiKey: z.string().min(10).optional(),
});

export const geminiTestImageSchema = z.object({
  prompt: z.string().min(1).default("A simple red apple icon, game asset, centered, plain background"),
  imageModel: z.string().min(1).optional(),
  apiKey: z.string().min(10).optional(),
});
