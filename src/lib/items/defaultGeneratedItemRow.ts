import type { GenerateItemsResult } from "@/types/ai";

/** 手动添加道具行时的默认模板 */
export function createDefaultGeneratedItemRow(index: number): GenerateItemsResult["items"][number] {
  return {
    name: `new_item_${index}`,
    displayName: `新道具 ${index}`,
    category1: "未分类",
    category2: undefined,
    color1: undefined,
    color2: undefined,
    shape: "oval",
    size: "medium",
    pattern: "纯色",
    targetScale: 1,
    moveSpeed: 3,
    role: "target",
    count: 9,
    isNew: true,
    imagePrompt: "single stylized 3D cartoon game item, centered, clean background",
    reason: "手动添加",
    riskTags: [],
  };
}
