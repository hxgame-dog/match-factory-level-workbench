import { getActiveColors } from "@/lib/items/colorPalette";
import { usesColorExpansion } from "@/lib/items/itemGenerationLimits";
import type { GenerateItemsResult } from "@/types/ai";

type BaseItem = GenerateItemsResult["items"][number];

/** 将 AI 返回的「物品种类」展开为 种类 × 颜色 条目的道具表；colorCount=0 时不展开，保留常规主色 */
export function expandItemTypesWithColors(
  baseItems: BaseItem[],
  colorCount: number,
): GenerateItemsResult["items"] {
  if (!usesColorExpansion(colorCount)) {
    return baseItems.map((base) => {
      const baseSlug = base.name.replace(/_(red|orange|yellow|green|blue|purple|pink|gray)$/i, "");
      return {
        ...base,
        name: baseSlug,
        color1: base.color1?.trim() || undefined,
        displayName: base.displayName ?? undefined,
        pattern: base.pattern ?? "纯色",
        moveSpeed: base.moveSpeed ?? 3,
        role: base.role ?? "target",
        isNew: base.isNew ?? true,
      };
    });
  }

  const colors = getActiveColors(colorCount);
  const expanded: GenerateItemsResult["items"] = [];

  for (const base of baseItems) {
    const baseSlug = base.name.replace(/_(red|orange|yellow|green|blue|purple|pink|gray)$/i, "");
    for (const color of colors) {
      expanded.push({
        ...base,
        name: `${baseSlug}_${color.key}`,
        displayName: base.displayName
          ? `${base.displayName} (${color.en})`
          : `${baseSlug} (${color.en})`,
        color1: color.key,
        color2: base.color2,
        pattern: base.pattern ?? "纯色",
        moveSpeed: base.moveSpeed ?? 3,
        role: base.role ?? "target",
        imagePrompt: `${base.imagePrompt.replace(/\s*,\s*(red|orange|yellow|green|blue|purple|pink|gray)(\s+color)?/gi, "")}, ${color.en} color, dominant ${color.en} tones`,
        reason: `${base.reason}; ${color.en} color variant`,
        isNew: true,
        catalogItemId: undefined,
        sourceItemId: undefined,
      });
    }
  }

  return expanded;
}
