import type { GeminiPlaytestAdviceInput } from "@/types/playtest";

export function playtestAdvicePrompt(input: GeminiPlaytestAdviceInput) {
  return [
    "你是关卡 QA 与平衡顾问。",
    "请基于输入的本地模拟结果，输出严格 JSON，不要 Markdown。",
    "不要凭空创造不存在的关卡数据。",
    `playtestResult=${JSON.stringify(input.playtestResult)}`,
    `formulaDiagnosis=${JSON.stringify(input.formulaDiagnosis ?? null)}`,
    `level=${JSON.stringify(input.level ?? null)}`,
    '输出格式: {"summary":"","keyFindings":[],"riskLevel":"low|medium|high|critical","suggestions":[{"priority":"high|medium|low","action":"","detail":"","expectedImpact":""}],"designerNotes":""}',
  ].join("\n");
}
