import { STANDARD_COLOR_PALETTE } from "@/lib/items/colorPalette";

/** 物品种类数上限（颜色数=0 时总条数即为此值） */
export const MAX_ITEM_TYPES = 3000;

/** 展开颜色变体时的总条数上限 */
export const MAX_TOTAL_ROWS = 10000;

/** 单次 AI 请求生成的种类数（超过则分批） */
export const ITEM_GENERATION_CHUNK_SIZE = 60;

/** 计算预期生成总条数 */
export function computeExpectedTotal(itemTypeCount: number, colorCount: number): number {
  if (colorCount <= 0) return itemTypeCount;
  return itemTypeCount * colorCount;
}

/** 校验生成参数是否合法 */
export function validateGenerationParams(itemTypeCount: number, colorCount: number): string | null {
  if (itemTypeCount < 1 || itemTypeCount > MAX_ITEM_TYPES) {
    return `物品种类数须在 1–${MAX_ITEM_TYPES} 之间`;
  }
  if (colorCount < 0 || colorCount > STANDARD_COLOR_PALETTE.length) {
    return `颜色数量须在 0–${STANDARD_COLOR_PALETTE.length} 之间（0 表示不展开变体）`;
  }
  if (colorCount === 0) return null;
  const total = itemTypeCount * colorCount;
  if (total > MAX_TOTAL_ROWS) {
    return `种类数 × 颜色数不能超过 ${MAX_TOTAL_ROWS} 条（当前 ${total}）`;
  }
  return null;
}

export function usesColorExpansion(colorCount: number): boolean {
  return colorCount > 0;
}
