import type { z } from "zod";

import { generatedItemSetPayloadSchema } from "@/lib/validators/ai";

export type GeneratedItemSetPayload = z.infer<typeof generatedItemSetPayloadSchema>;

export function toDbGeneratedItemSetFields(payload: GeneratedItemSetPayload) {
  const categories = [...new Set(payload.items.map((item) => item.category1))];
  const totalItemCount =
    payload.colorCount <= 0
      ? payload.itemTypeCount
      : payload.itemTypeCount * payload.colorCount;
  return {
    name: payload.name,
    theme: payload.description,
    prompt: payload.description,
    totalItemCount,
    targetTypeCount: payload.itemTypeCount,
    targetCountEach: payload.colorCount <= 0 ? 1 : payload.colorCount,
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

/** 规范化导出/保存前的道具行，补齐必填字段与道具 ID */
export function normalizeGeneratedItemsForExport(
  items: GeneratedItemSetPayload["items"],
): GeneratedItemSetPayload["items"] {
  return items.map((item, index) => ({
    ...item,
    itemId: item.itemId ?? index + 1,
    imagePrompt: (item.imagePrompt ?? "").trim() || "-",
    reason: (item.reason ?? "").trim() || "-",
    role: item.role ?? "target",
    moveSpeed: item.moveSpeed ?? 3,
    pattern: (item.pattern ?? "").trim() || "纯色",
    count: item.count > 0 ? item.count : 9,
  }));
}

/** 将请求体规范为可导出的 payload（校验前补齐缺省字段） */
export function prepareGeneratedItemSetExportPayload(body: unknown): GeneratedItemSetPayload {
  const record = body as Record<string, unknown>;
  const items = Array.isArray(record.items) ? (record.items as GeneratedItemSetPayload["items"]) : [];
  return generatedItemSetPayloadSchema.parse({
    name: record.name,
    description: record.description,
    itemTypeCount: record.itemTypeCount,
    colorCount: record.colorCount,
    summary: record.summary,
    warnings: record.warnings ?? [],
    items: normalizeGeneratedItemsForExport(items),
  });
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
