/** 标准 8 色（与策划约定顺序一致） */
export const STANDARD_COLOR_PALETTE = [
  { key: "red", label: "红色", en: "red" },
  { key: "orange", label: "橙色", en: "orange" },
  { key: "yellow", label: "黄色", en: "yellow" },
  { key: "green", label: "绿色", en: "green" },
  { key: "blue", label: "蓝色", en: "blue" },
  { key: "purple", label: "紫色", en: "purple" },
  { key: "pink", label: "粉色", en: "pink" },
  { key: "gray", label: "灰色", en: "gray" },
] as const;

export function getActiveColors(colorCount: number) {
  const n = Math.min(Math.max(1, colorCount), STANDARD_COLOR_PALETTE.length);
  return STANDARD_COLOR_PALETTE.slice(0, n);
}
