import type { DiagnoseLevelInput } from "@/types/ai";
import type { GeminiDifficultyAdviceInput } from "@/types/difficulty";

export function diagnoseLevelPrompt(input: DiagnoseLevelInput): string {
  return [
    "你是 Match Factory 关卡难度诊断助手。",
    "请根据输入给出 JSON 结果，不要输出 markdown。",
    "输出字段必须满足 DiagnoseLevelResult。",
    `levelConfig: ${JSON.stringify(input.levelConfig)}`,
    `items: ${JSON.stringify(input.items)}`,
    `formulaConfig: ${JSON.stringify(input.formulaConfig ?? {})}`,
  ].join("\n");
}

export function diagnoseDifficultyAdvicePrompt(input: GeminiDifficultyAdviceInput): string {
  return [
    "你是关卡难度诊断顾问。",
    "只基于提供的诊断结果和关卡配置给出优化建议，不要改写公式计算值。",
    "不要凭空创造不存在道具。",
    "输出严格 JSON，字段: summary, risks, suggestions(priority/title/detail/expectedEffect), balancingAdvice。",
    `level: ${JSON.stringify(input.level)}`,
    `diagnosis: ${JSON.stringify(input.diagnosis)}`,
  ].join("\n");
}
