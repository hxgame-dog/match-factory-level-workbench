import type { z } from "zod";

import type { generatedItemSetPayloadSchema } from "@/lib/validators/ai";

export type GeneratedItemSetPayload = z.infer<typeof generatedItemSetPayloadSchema>;

export function toDbGeneratedItemSetFields(payload: GeneratedItemSetPayload) {
  const categories = [...new Set(payload.items.map((item) => item.category1))];
  const totalItemCount = payload.itemTypeCount * payload.colorCount;
  return {
    name: payload.name,
    theme: payload.description,
    prompt: payload.description,
    totalItemCount,
    targetTypeCount: payload.itemTypeCount,
    targetCountEach: payload.colorCount,
    distractorTypeCount: 0,
    difficultyIntent: "normal",
    constraints: JSON.stringify({
      itemTypeCount: payload.itemTypeCount,
      colorCount: payload.colorCount,
      categories,
      mode: "ai_free",
    }),
    summary: payload.summary,
  };
}

export function parseStoredGenerationConfig(constraints: string | null | undefined) {
  if (!constraints) {
    return { itemTypeCount: 12, colorCount: 8, categories: [] as string[] };
  }
  try {
    const parsed = JSON.parse(constraints) as {
      itemTypeCount?: number;
      colorCount?: number;
      categories?: string[];
    };
    return {
      itemTypeCount: parsed.itemTypeCount ?? 12,
      colorCount: parsed.colorCount ?? 8,
      categories: parsed.categories ?? [],
    };
  } catch {
    return { itemTypeCount: 12, colorCount: 8, categories: [] as string[] };
  }
}

/** @deprecated 使用 parseStoredGenerationConfig */
export function parseStoredCategories(constraints: string | null | undefined): string[] {
  return parseStoredGenerationConfig(constraints).categories;
}
