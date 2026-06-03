import { getItemBaseName } from "@/lib/items/itemName";
import { normalizeColorKey } from "@/lib/items/colorPalette";
import type { GenerateItemsResult } from "@/types/ai";

type ItemRow = {
  id: string;
  name: string;
  displayName?: string | null;
  category1: string;
  category2?: string | null;
  color1?: string | null;
  color2?: string | null;
  shape?: string | null;
  size?: string | null;
  pattern?: string | null;
  role?: string | null;
  count?: number | null;
  sourceItemId?: number | null;
  catalogItemId?: string | null;
};

export function collectActiveColorKeys(items: ItemRow[]): string[] {
  const keys = new Set<string>();
  for (const item of items) {
    const key = normalizeColorKey(item.color1);
    if (key) keys.add(key);
  }
  return [...keys];
}

export function filterItemsByBaseName(
  items: ItemRow[],
  baseItemName: string,
): ItemRow[] {
  return items.filter(
    (i) => getItemBaseName(i as unknown as GenerateItemsResult["items"][number]) === baseItemName,
  );
}

export function findItemByColorKey(items: ItemRow[], colorKey: string): ItemRow | undefined {
  return items.find((i) => normalizeColorKey(i.color1) === colorKey);
}
