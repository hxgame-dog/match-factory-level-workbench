import type { GeminiAnalyticsAdviceInput } from "@/types/analytics";

export function analyticsFeedbackAdvicePrompt(input: GeminiAnalyticsAdviceInput): string {
  return [
    "你是手游关卡数值与运营分析专家。",
    "请基于输入的真实玩家数据、公式诊断与模拟结果，分析关卡真实表现并给出优化建议。",
    "严格要求：",
    "1. 只基于输入数据分析，不要编造真实数据。",
    "2. 如果数据置信度低（样本少），必须明确指出，并区分‘关卡真的难’与‘样本太少’。",
    "3. 区分‘公式误判’和‘模拟器误判’。",
    "4. 输出严格 JSON，不要 Markdown。",
    `analytics=${JSON.stringify(input.analytics)}`,
    `feedbackDiagnosis=${JSON.stringify(input.feedbackDiagnosis)}`,
    `formulaDiagnosis=${JSON.stringify(input.formulaDiagnosis ?? null)}`,
    `playtestResult=${JSON.stringify(input.playtestResult ?? null)}`,
    `level=${JSON.stringify(input.level ?? null)}`,
    '输出格式: {"summary":"","keyFindings":[],"rootCauseHypotheses":[{"title":"","confidence":"low|medium|high","detail":""}],"optimizationSuggestions":[{"priority":"high|medium|low","action":"","detail":"","expectedMetricImpact":""}],"formulaCalibrationNotes":"","playtestCalibrationNotes":""}',
  ].join("\n");
}
