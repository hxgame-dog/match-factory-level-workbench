import { expandItemTypesWithColors } from "@/lib/ai/expandItemTypesWithColors";
import { assignSequentialItemIds } from "@/lib/items/assignSequentialItemIds";
import { getActiveColors } from "@/lib/items/colorPalette";
import type { GenerateItemsInput, GenerateItemsResult } from "@/types/ai";

function normalizeBaseItems(items: GenerateItemsResult["items"]): GenerateItemsResult["items"] {
  return items.map((item) => ({
    ...item,
    role: item.role ?? "target",
    moveSpeed: item.moveSpeed ?? 3,
  }));
}

export function finalizeFreeGeneratedItems(
  result: GenerateItemsResult,
  input: Pick<GenerateItemsInput, "colorCount" | "itemTypeCount">,
): GenerateItemsResult {
  const expanded = expandItemTypesWithColors(normalizeBaseItems(result.items), input.colorCount);
  const warnings = [...result.warnings];
  const expectedTotal = input.itemTypeCount * input.colorCount;
  if (result.items.length < input.itemTypeCount * 0.8) {
    warnings.push(
      `AI 仅返回 ${result.items.length} 种基础造型（目标 ${input.itemTypeCount} 种），已按 ${input.colorCount} 色展开为 ${expanded.length} 条`,
    );
  }
  if (expanded.length < expectedTotal * 0.65) {
    warnings.push(`展开后共 ${expanded.length} 条，低于目标 ${expectedTotal} 条，可适当减少种类数或重试`);
  }

  return {
    summary: result.summary,
    warnings,
    items: assignSequentialItemIds(expanded),
  };
}

export function buildMockFreeItems(input: GenerateItemsInput): GenerateItemsResult {
  const typeCount = Math.min(input.itemTypeCount, 24);
  const baseItems = Array.from({ length: typeCount }, (_, index) => {
    const slug = `mock_item_${index + 1}`;
    return {
      name: slug,
      displayName: `示例道具${index + 1}`,
      category1: "mock_category",
      color2: "cream",
      pattern: ["纯色", "纵纹", "斑点"][index % 3],
      moveSpeed: (index % 5) + 1,
      count: 9,
      isNew: true,
      imagePrompt: `single stylized 3D cartoon ${input.description} game item ${index + 1}, centered, clean background`,
      reason: `Mock 基础造型 ${index + 1}`,
      riskTags: [] as string[],
    };
  });

  const colors = getActiveColors(input.colorCount);
  const expanded = expandItemTypesWithColors(baseItems, input.colorCount);
  const total = input.itemTypeCount * input.colorCount;

  return {
    summary: `Mock：${typeCount} 种造型 × ${input.colorCount} 色（${colors.map((c) => c.label).join("、")}），共 ${expanded.length} 条（目标 ${total} 条）。`,
    warnings: ["当前为 Mock 输出，未调用 Gemini。"],
    items: assignSequentialItemIds(expanded),
  };
}
