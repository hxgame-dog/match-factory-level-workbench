import { getActiveColors } from "@/lib/items/colorPalette";
import type { GenerateItemsInput } from "@/types/ai";

export function generateItemsPrompt(input: GenerateItemsInput): string {
  const colors = getActiveColors(input.colorCount);
  const colorList = colors.map((c) => `${c.label}(${c.en})`).join("、");

  const outputSchemaExample = `{
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
      "targetScale": 1,
      "role": "target",
      "count": 9,
      "isNew": true,
      "imagePrompt": "single stylized 3D cartoon clownfish game item, centered, clean background, mobile puzzle game asset",
      "reason": "海洋主题基础造型，轮廓清晰",
      "riskTags": []
    }
  ]
}`;

  const totalRows = input.itemTypeCount * input.colorCount;

  return [
    "你是 Match 3D 类手游的关卡策划助手。请根据用户描述原创生成「基础物品种类」列表。",
    "本次只需输出基础造型（不含颜色变体）；服务端会按标准色板自动展开为多种颜色。",
    "不要输出 catalogItemId、sourceItemId。所有 isNew=true。",
    "items 数组长度必须约等于「物品种类数」，不要在此阶段输出颜色后缀。",
    "name 为英文 slug（如 clownfish），displayName 为中文；category1 由你根据描述自动划分。",
    "不要填写 color1/color2（颜色由系统展开）。",
    "role 主要为 target；count 建议 9。imagePrompt 描述造型，勿写具体颜色。",
    "输出严格 JSON，无 Markdown。",
    `输出格式:\n${outputSchemaExample}`,
    `道具集名称: ${input.setName}`,
    `自定义描述: ${input.description}`,
    `物品种类数（items 条数应约等于此值）: ${input.itemTypeCount}`,
    `颜色数量（系统将每种造型展开为以下 ${input.colorCount} 色，合计约 ${totalRows} 条）: ${colorList}`,
  ].join("\n");
}
