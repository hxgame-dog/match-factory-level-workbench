import type { GenerateItemsInput } from "@/types/ai";

export function generateItemsPrompt(input: GenerateItemsInput): string {
  const outputSchemaExample = `{
  "summary": "string",
  "warnings": ["string"],
  "items": [
    {
      "sourceItemId": 1001,
      "catalogItemId": "clxxxxxxxxxxxxxxxx",
      "name": "Basketball",
      "displayName": "篮球",
      "category1": "sports",
      "category2": "ball",
      "color1": "orange",
      "color2": "black",
      "shape": "round",
      "size": "medium",
      "targetScale": 1,
      "role": "target",
      "count": 9,
      "isNew": false,
      "imagePrompt": "single stylized 3D cartoon basketball game item, centered, clean background, mobile puzzle game asset",
      "reason": "作为运动主题目标物，形状清晰，颜色醒目",
      "riskTags": ["round_shape_confusion"]
    }
  ]
}`;

  return [
    "你是 Match 3D 类手游的关卡策划助手，需要基于已有道具库生成一套关卡道具表。",
    "你必须优先从候选道具中选择，不要凭空乱造。",
    "catalogItemId 必须填写候选道具 JSON 里的 id 字段（cuid 字符串），禁止填写 name、英文名或自造 ID。",
    "sourceItemId 填写候选道具的 itemId（数字）；若无则省略。",
    "仅当候选不足时才生成新道具：isNew=true，且不要填写 catalogItemId。",
    "需要考虑：目标物和干扰物比例、颜色/形状/分类相似度、物体大小、主题一致性、难度倾向。",
    "所有 imagePrompt 必须可用于后续图片资源生成。",
    "不要生成侵权内容，不要直接复制 Match Factory 原版资产描述。",
    "输出必须是严格 JSON，不要 Markdown，不要解释文本。",
    `输出格式必须严格遵循:\n${outputSchemaExample}`,
    `SetName: ${input.setName}`,
    `主题: ${input.theme}`,
    `总道具数量: ${input.totalItemCount}`,
    `目标物种类数: ${input.targetTypeCount}`,
    `每种目标物数量: ${input.targetCountEach}`,
    `干扰物种类数: ${input.distractorTypeCount}`,
    `难度倾向: ${input.difficultyIntent}`,
    `额外约束: ${input.constraints ?? "无"}`,
    `仅使用已有道具: ${input.useExistingCatalogOnly ? "是" : "否"}`,
    `道具库摘要: ${JSON.stringify(input.catalogSummary)}`,
    `候选道具(最多150): ${JSON.stringify(input.candidateItems)}`,
  ].join("\n");
}
