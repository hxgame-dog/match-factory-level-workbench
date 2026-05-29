import type { GenerateLevelInput } from "@/types/level";

export function generateLevelPrompt(input: GenerateLevelInput) {
  return [
    "你是 Match 3D 类手游关卡策划专家，需要基于已有道具组合生成候选关卡配置。",
    "你只能使用输入 items 中的道具，不要凭空创造新道具。",
    "targets 必须只包含 role=target 的道具。",
    "spawns 可以包含 target、distractor、filler、special。",
    "需综合考虑目标数量、干扰物数量、时间限制、槽位、规则难度。",
    "easy 降低干扰与相似度；hard/expert 增加相似压迫与目标稀疏感。",
    "不要复刻 Match Factory 原版关卡。",
    "输出必须严格 JSON，不要 Markdown，不要解释文本。",
    "输出结构必须符合 GenerateLevelResult。",
    `输入: ${JSON.stringify(input)}`,
  ].join("\n");
}
