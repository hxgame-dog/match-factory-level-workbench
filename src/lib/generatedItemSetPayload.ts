import type { z } from "zod";

import type { generatedItemSetPayloadSchema } from "@/lib/validators/ai";

export type GeneratedItemSetPayload = z.infer<typeof generatedItemSetPayloadSchema>;

export function toDbGeneratedItemSetFields(payload: GeneratedItemSetPayload) {
  return {
    name: payload.name,
    theme: payload.description,
    prompt: payload.description,
    totalItemCount: payload.itemCount,
    targetTypeCount: payload.items.length,
    targetCountEach: 1,
    distractorTypeCount: 0,
    difficultyIntent: "normal",
    constraints: JSON.stringify({ categories: payload.categories, mode: "ai_free" }),
    summary: payload.summary,
  };
}

export function parseStoredCategories(constraints: string | null | undefined): string[] {
  if (!constraints) return [];
  try {
    const parsed = JSON.parse(constraints) as { categories?: string[] };
    if (Array.isArray(parsed.categories) && parsed.categories.length > 0) {
      return parsed.categories;
    }
  } catch {
    // legacy: comma-separated
  }
  return constraints
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
