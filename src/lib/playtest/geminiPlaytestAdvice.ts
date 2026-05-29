import { generatePlaytestAdvice } from "@/lib/ai/gemini";
import type { GeminiPlaytestAdviceInput } from "@/types/playtest";

export async function requestGeminiPlaytestAdvice(input: GeminiPlaytestAdviceInput) {
  return generatePlaytestAdvice(input);
}
