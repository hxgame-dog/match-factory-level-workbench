import type { GenerateItemsResult } from "@/types/ai";

const COLOR_SUFFIX_RE = /_(red|orange|yellow|green|blue|purple|pink|gray)$/i;
const DISPLAY_COLOR_SUFFIX_RE = /\s*\((red|orange|yellow|green|blue|purple|pink|gray)\)\s*$/i;

/** 将颜色变体道具归并为同类物品名（如：小丑鱼 (red) -> 小丑鱼） */
export function getItemBaseName(item: GenerateItemsResult["items"][number]): string {
  const display = (item.displayName ?? "").trim();
  if (display) {
    const stripped = display.replace(DISPLAY_COLOR_SUFFIX_RE, "").trim();
    if (stripped) return stripped;
  }
  const slug = (item.name ?? "").trim().replace(COLOR_SUFFIX_RE, "");
  if (!slug) return "未命名物品";
  return slug.replace(/_/g, " ");
}
