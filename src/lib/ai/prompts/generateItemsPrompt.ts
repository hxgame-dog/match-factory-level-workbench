import type { GenerateItemsInput } from "@/types/ai";

export function generateItemsPrompt(input: GenerateItemsInput): string {
  const outputSchemaExample = `{
  "summary": "string",
  "warnings": ["string"],
  "items": [
    {
      "name": "Clownfish",
      "displayName": "小丑鱼",
      "category1": "sea_creature",
      "category2": "fish",
      "color1": "orange",
      "color2": "white",
      "shape": "oval",
      "size": "small",
      "targetScale": 1,
      "role": "target",
      "count": 9,
      "isNew": true,
      "imagePrompt": "single stylized 3D cartoon clownfish game item, centered, clean background, mobile puzzle game asset",
      "reason": "海洋主题目标物，轮廓清晰",
      "riskTags": []
    }
  ]
}`;

  return [
    "你是 Match 3D 类手游的关卡策划助手。请根据用户描述**原创生成**一套道具表，不依赖外部道具库。",
    "不要输出 catalogItemId、sourceItemId。所有条目的 isNew 必须为 true。",
    "category1 由你根据描述自动划分（英文小写+下划线，如 sea_creature、breakfast_food），须与描述主题一致。",
    "name 使用英文标识，displayName 使用中文展示名。",
    "role 主要为 target；count 建议为 9（三消关卡常用）。",
    "imagePrompt 须可直接用于后续 AI 出图（单物体、居中、干净背景、卡通 3D）。",
    "不要生成侵权内容。输出必须是严格 JSON，不要 Markdown。",
    `输出格式必须严格遵循:\n${outputSchemaExample}`,
    `道具集名称: ${input.setName}`,
    `自定义描述: ${input.description}`,
    `需要生成的道具种类数（items 数组长度应约为 ${input.itemCount}）: ${input.itemCount}`,
  ].join("\n");
}
