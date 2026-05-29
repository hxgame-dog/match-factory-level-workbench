import type { GenerateItemsResult } from "@/types/ai";

/** 为道具表行分配从 1 开始的连续道具 ID（删除行后会重新编号） */
export function assignSequentialItemIds(
  items: GenerateItemsResult["items"],
): GenerateItemsResult["items"] {
  return items.map((item, index) => ({ ...item, itemId: index + 1 }));
}
