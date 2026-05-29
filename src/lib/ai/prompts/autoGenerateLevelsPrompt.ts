import type { AutoGenerateLevelsInput, SourceLevelPatternAnalysis } from "@/types/autoLevel";
import type { LevelConfig } from "@/types/level";

export function autoGenerateLevelsPrompt(input: {
  request: AutoGenerateLevelsInput;
  sourceAnalysis: SourceLevelPatternAnalysis;
  target: { levelIndex: number; targetP: number; label: string; reason: string };
  sourceLevels: LevelConfig[];
  availableItems: unknown[];
}): string {
  return [
    "你是 Match 3D 类手游关卡数值策划专家。",
    "请基于前 N 关规律、目标难度曲线、已有道具集合生成后续关卡候选。",
    "只能使用输入 items，不要凭空创造不存在道具，除非 allowNewItemSet=true。",
    "每个候选必须是标准 LevelConfig。",
    "输出严格 JSON，不要 Markdown，不要解释文本。",
    "不要复刻 Match Factory 原版关卡。",
    `request: ${JSON.stringify(input.request)}`,
    `sourceAnalysis: ${JSON.stringify(input.sourceAnalysis)}`,
    `target: ${JSON.stringify(input.target)}`,
    `sourceLevels: ${JSON.stringify(input.sourceLevels)}`,
    `availableItems: ${JSON.stringify(input.availableItems)}`,
  ].join("\n");
}
