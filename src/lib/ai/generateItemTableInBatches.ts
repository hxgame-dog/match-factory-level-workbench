import {
  ITEM_GENERATION_CHUNK_SIZE,
  computeExpectedTotal,
} from "@/lib/items/itemGenerationLimits";
import type { GenerateItemsInput, GenerateItemsResult } from "@/types/ai";

type GenerateChunkFn = (
  chunkInput: GenerateItemsInput,
  options: { batchIndex: number; batchTotal: number; existingNames: string[] },
) => Promise<GenerateItemsResult>;

/** 超过单次上限时分批调用 AI，合并结果 */
export async function generateItemTableInBatches(
  input: GenerateItemsInput,
  generateChunk: GenerateChunkFn,
): Promise<GenerateItemsResult> {
  const { itemTypeCount } = input;
  if (itemTypeCount <= ITEM_GENERATION_CHUNK_SIZE) {
    return generateChunk(input, { batchIndex: 0, batchTotal: 1, existingNames: [] });
  }

  const batchTotal = Math.ceil(itemTypeCount / ITEM_GENERATION_CHUNK_SIZE);
  const warnings: string[] = [
    `物品种类数 ${itemTypeCount} 较多，已分 ${batchTotal} 批生成（每批约 ${ITEM_GENERATION_CHUNK_SIZE} 种）`,
  ];
  const mergedItems: GenerateItemsResult["items"] = [];
  const existingNames: string[] = [];
  let summary = "";

  for (let batchIndex = 0; batchIndex < batchTotal; batchIndex += 1) {
    const remaining = itemTypeCount - batchIndex * ITEM_GENERATION_CHUNK_SIZE;
    const chunkTypeCount = Math.min(ITEM_GENERATION_CHUNK_SIZE, remaining);
    const chunkInput: GenerateItemsInput = { ...input, itemTypeCount: chunkTypeCount };

    const chunk = await generateChunk(chunkInput, { batchIndex, batchTotal, existingNames });
    if (!summary && chunk.summary) summary = chunk.summary;
    warnings.push(...chunk.warnings);

    for (const item of chunk.items) {
      const slug = item.name.replace(/_(red|orange|yellow|green|blue|purple|pink|gray)$/i, "");
      if (existingNames.includes(slug)) {
        warnings.push(`跳过重复种类：${slug}`);
        continue;
      }
      existingNames.push(slug);
      mergedItems.push(item);
    }
  }

  const expectedTotal = computeExpectedTotal(input.itemTypeCount, input.colorCount);
  if (mergedItems.length < expectedTotal * 0.5) {
    warnings.push(`合并后共 ${mergedItems.length} 条基础造型，低于目标，可重试或减少种类数`);
  }

  return {
    summary: summary || `共生成 ${mergedItems.length} 种物品（目标 ${input.itemTypeCount} 种）`,
    warnings,
    items: mergedItems,
  };
}
