import { STANDARD_COLOR_PALETTE, getPaletteColorLabel } from "@/lib/items/colorPalette";

export type VariantSheetAnchor = {
  baseItemName: string;
  category1?: string;
  shape?: string;
  size?: string;
  pattern?: string;
  color2?: string;
  displayName?: string;
};

export type BuildVariantSheetPromptInput = {
  anchor: VariantSheetAnchor;
  /** 上传参考图分析得到的中文美术风格（不含具体物体） */
  globalArtStyle: string;
  negativePrompt?: string;
  /** 组内存在的 color1 key 集合（如 red, blue） */
  activeColorKeys: string[];
};

/** 构造中文统一母版提示词：风格 + 道具属性 + 2×4 八色排版 */
export function buildVariantSheetPrompt(input: BuildVariantSheetPromptInput): string {
  const { anchor, globalArtStyle, negativePrompt, activeColorKeys } = input;
  const itemName = anchor.displayName?.trim() || anchor.baseItemName;

  const cellLines = STANDARD_COLOR_PALETTE.map((c, index) => {
    const col = (index % 4) + 1;
    const row = Math.floor(index / 4) + 1;
    const position = `第${row}行第${col}列`;
    if (activeColorKeys.includes(c.key)) {
      return `${position}：${c.label}（主色）的「${itemName}」`;
    }
    return `${position}：纯白空格，不放任何物体`;
  });

  const attributeLines = [
    anchor.category1 ? `类别：${anchor.category1}` : "",
    anchor.shape ? `形态：${anchor.shape}` : "",
    anchor.size ? `大小：${anchor.size}` : "",
    anchor.pattern ? `花纹：${anchor.pattern}` : "",
    anchor.color2 ? `辅助色（点缀/花纹颜色，所有格子保持一致）：${getPaletteColorLabel(anchor.color2)}` : "",
  ].filter(Boolean);

  return [
    "请生成【一张】精灵表（sprite sheet）图片。",
    "排版要求（必须严格遵守）：整张图正好是 2 行 4 列，总共 8 个等大的格子，不能多也不能少，不要出现第 3 行。",
    "每个格子里是【同一个物品】，造型、镜头角度、比例、材质、光照完全一致，唯一区别是物体的主色不同。",
    "颜色顺序：上排从左到右为 红、橙、黄、绿；下排从左到右为 蓝、紫、粉、灰。",
    "整张画布与所有空格都使用纯白背景；不要文字、不要标签、不要边框、不要网格线、不要水印、格子之间不要阴影。",
    "",
    `物品名称：${itemName}`,
    ...attributeLines,
    "",
    "美术风格（仅用于风格参考，不要照搬参考图里的具体物体）：",
    globalArtStyle,
    "",
    "逐格内容：",
    ...cellLines,
    "",
    negativePrompt?.trim() ? `避免出现：${negativePrompt.trim()}` : "",
  ]
    .filter((line) => line !== undefined)
    .join("\n");
}
