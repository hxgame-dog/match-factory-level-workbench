import { STANDARD_COLOR_PALETTE } from "@/lib/items/colorPalette";

export type VariantSheetAnchor = {
  baseItemName: string;
  category1?: string;
  shape?: string;
  size?: string;
  pattern?: string;
  displayName?: string;
};

export type BuildVariantSheetPromptInput = {
  anchor: VariantSheetAnchor;
  globalArtStyle: string;
  negativePrompt?: string;
  /** 组内存在的 color1 key 集合（如 red, blue） */
  activeColorKeys: string[];
};

export function buildVariantSheetPrompt(input: BuildVariantSheetPromptInput): string {
  const { anchor, globalArtStyle, negativePrompt, activeColorKeys } = input;
  const colorOrder = STANDARD_COLOR_PALETTE.map((c) => c.key);
  const cellDescriptions = colorOrder.map((key, index) => {
    const col = index % 4;
    const row = Math.floor(index / 4);
    const label = STANDARD_COLOR_PALETTE.find((c) => c.key === key)?.en ?? key;
    if (activeColorKeys.includes(key)) {
      return `cell row ${row + 1} col ${col + 1}: same ${anchor.baseItemName} object recolored to ${label}, identical pose scale lighting material`;
    }
    return `cell row ${row + 1} col ${col + 1}: completely empty pure white cell, no object`;
  });

  return [
    "Create ONE single image: a sprite sheet with exactly 2 rows and 4 columns (8 equal cells).",
    "Layout: top row left-to-right red, orange, yellow, green; bottom row left-to-right blue, purple, pink, gray.",
    "Pure flat white background for the entire canvas and for any empty cells.",
    "No text, no labels, no borders, no grid lines, no watermarks, no shadows between cells.",
    "Every non-empty cell must show the SAME stylized 3D cartoon game item: same silhouette, camera angle, orthographic view, material, lighting, proportions — ONLY body color changes per cell.",
    `Subject: ${anchor.baseItemName}${anchor.displayName ? ` (${anchor.displayName})` : ""}.`,
    anchor.category1 ? `Category: ${anchor.category1}.` : "",
    anchor.shape ? `Shape: ${anchor.shape}.` : "",
    anchor.size ? `Size: ${anchor.size}.` : "",
    anchor.pattern ? `Pattern: ${anchor.pattern}.` : "",
    "Match the visual style of the attached reference image exactly (material, rendering, eyes, proportions).",
    ...cellDescriptions,
    `Global art style: ${globalArtStyle}`,
    negativePrompt?.trim() ? `Avoid: ${negativePrompt.trim()}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}
