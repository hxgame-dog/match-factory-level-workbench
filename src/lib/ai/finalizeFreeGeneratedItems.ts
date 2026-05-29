import type { GenerateItemsInput, GenerateItemsResult } from "@/types/ai";

/** 方案 A：剥离库引用，标记为 AI 新建 */
export function finalizeFreeGeneratedItems(result: GenerateItemsResult): GenerateItemsResult {
  return {
    ...result,
    items: result.items.map((item) => ({
      ...item,
      catalogItemId: undefined,
      sourceItemId: undefined,
      isNew: true,
    })),
  };
}

export function buildMockFreeItems(input: GenerateItemsInput): GenerateItemsResult {
  const count = Math.min(input.itemCount, 12);
  const items = Array.from({ length: count }, (_, index) => {
    const category = "mock_category";
    const slug = `item_${index + 1}`;
    return {
      name: slug,
      displayName: `示例道具${index + 1}`,
      category1: category,
      role: "target" as const,
      count: 9,
      isNew: true,
      imagePrompt: `single stylized 3D cartoon ${input.description} ${category} game item, centered, clean background, mobile puzzle game asset`,
      reason: `Mock：基于描述「${input.description.slice(0, 40)}」生成的示例道具`,
      riskTags: [] as string[],
    };
  });

  return {
    summary: `Mock 模式：已生成 ${items.length} 种道具（目标 ${input.itemCount} 种）。`,
    warnings: ["当前为 Mock 输出，未调用 Gemini。"],
    items,
  };
}
