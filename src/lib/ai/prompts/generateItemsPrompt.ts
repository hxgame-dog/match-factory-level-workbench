import { getActiveColors } from "@/lib/items/colorPalette";
import { computeExpectedTotal, usesColorExpansion } from "@/lib/items/itemGenerationLimits";
import type { GenerateItemsInput } from "@/types/ai";

export type GenerateItemsPromptOptions = GenerateItemsInput & {
  /** 分批生成时的批次信息 */
  batchIndex?: number;
  batchTotal?: number;
  /** 已生成物品种类 slug，避免重复 */
  existingNames?: string[];
};

export function generateItemsPrompt(input: GenerateItemsPromptOptions): string {
  const expectedTotal = computeExpectedTotal(input.itemTypeCount, input.colorCount);
  const batchHint =
    input.batchTotal && input.batchTotal > 1
      ? `\n本批为第 ${(input.batchIndex ?? 0) + 1}/${input.batchTotal} 批，本批需输出约 ${input.itemTypeCount} 种，勿与已有种类重复。`
      : "";
  const existingHint =
    input.existingNames && input.existingNames.length > 0
      ? `\n已有种类 slug（勿重复）：${input.existingNames.slice(-80).join(", ")}${input.existingNames.length > 80 ? "…" : ""}`
      : "";

  const outputSchemaExample = usesColorExpansion(input.colorCount)
    ? `{
  "summary": "string",
  "warnings": ["string"],
  "items": [
    {
      "name": "clownfish",
      "displayName": "小丑鱼",
      "category1": "sea_creature",
      "category2": "fish",
      "shape": "oval",
      "size": "small",
      "pattern": "斑点",
      "targetScale": 1,
      "color2": "white",
      "moveSpeed": 3,
      "isNew": true,
      "imagePrompt": "single stylized 3D cartoon clownfish game item, centered, clean background, mobile puzzle game asset",
      "reason": "海洋主题基础造型，轮廓清晰",
      "riskTags": []
    }
  ]
}`
    : `{
  "summary": "string",
  "warnings": ["string"],
  "items": [
    {
      "name": "clownfish",
      "displayName": "小丑鱼",
      "category1": "sea_creature",
      "category2": "fish",
      "color1": "orange",
      "shape": "oval",
      "size": "small",
      "pattern": "斑点",
      "color2": "white",
      "moveSpeed": 3,
      "isNew": true,
      "imagePrompt": "single stylized 3D cartoon orange clownfish game item, centered, clean background",
      "reason": "小丑鱼常规体色为橙白相间",
      "riskTags": []
    }
  ]
}`;

  const colorSection = usesColorExpansion(input.colorCount)
    ? (() => {
        const colors = getActiveColors(input.colorCount);
        const colorList = colors.map((c) => `${c.label}(${c.en})`).join("、");
        return [
          "本次只需输出基础造型（不含颜色变体）；服务端会按标准色板自动展开为多种颜色。",
          "不要填写 color1（主色由系统按标准色板展开）。",
          `颜色数量（系统将每种造型展开为以下 ${input.colorCount} 色，合计约 ${expectedTotal} 条）: ${colorList}`,
        ].join("\n");
      })()
    : [
        "本次不展开标准色板变体：每种物品输出 1 条，共约等于物品种类数。",
        "必须为每条填写 color1：该物种/物体在自然界或常见认知中的【常规主色】（英文 key，如 orange、red、blue、green、yellow、purple、pink、gray、brown、white、black 等）。",
        "name 不要带颜色后缀；displayName 为中文本名，不带括号颜色。",
        "imagePrompt 应体现 color1 所描述的常规主色。",
      ].join("\n");

  return [
    "你是 Match 3D 类手游的关卡策划助手。请根据用户描述原创生成「物品种类」列表。",
    colorSection,
    "不要输出 catalogItemId、sourceItemId。所有 isNew=true。",
    usesColorExpansion(input.colorCount)
      ? "items 数组长度必须约等于「物品种类数」，不要在此阶段输出颜色后缀。"
      : "items 数组长度必须约等于「物品种类数」，每条一种物品。",
    "name 为英文 slug（如 clownfish），displayName 为中文；category1 由你根据描述自动划分。",
    "color2 为物体本身的次要/点缀颜色（英文，如 white、silver），与标准色板主色无关。",
    "moveSpeed 为整数 1–5：1 很慢、2 慢、3 中、4 快、5 很快。",
    "pattern 为花纹（中文）：根据物种/材质选择，如纯色、纵纹、横纹、斑点、渐变、拼接、棋盘格等。",
    "不要输出 count 字段。",
    "输出严格 JSON，无 Markdown。",
    `输出格式:\n${outputSchemaExample}`,
    `道具集名称: ${input.setName}`,
    `自定义描述: ${input.description}`,
    `物品种类数（items 条数应约等于此值）: ${input.itemTypeCount}`,
    batchHint,
    existingHint,
  ]
    .filter(Boolean)
    .join("\n");
}
