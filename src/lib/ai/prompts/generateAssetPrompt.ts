import type { GenerateAssetPromptInput } from "@/types/ai";

export function generateAssetPromptText(input: GenerateAssetPromptInput): string {
  return [
    "你是手游资源图片提示词助手。",
    "请输出 JSON，字段包含 prompt、negativePrompt、notes。",
    "prompt 必须为 50-120 个英文单词，强调 single object、centered、clean/transparent background、mobile puzzle game asset、consistent style、no text、no watermark。",
    "不要生成复杂场景、角色、侵权描述。",
    `item: ${JSON.stringify(input.item)}`,
    `globalArtStyle: ${input.globalArtStyle}`,
    `negativePrompt: ${input.negativePrompt ?? ""}`,
  ].join("\n");
}
