import type {
  DiagnoseLevelInput,
  DiagnoseLevelResult,
  GenerateAssetPromptInput,
  GenerateAssetPromptResult,
  GenerateItemsInput,
  GenerateItemsResult,
} from "@/types/ai";
import type { GenerateAssetImageInput, GenerateAssetImageResult } from "@/types/asset";
import type { GenerateLevelInput, GenerateLevelResult } from "@/types/level";

export type {
  GenerateItemsInput,
  GenerateItemsResult,
  DiagnoseLevelInput,
  DiagnoseLevelResult,
  GenerateAssetPromptInput,
  GenerateAssetPromptResult,
  GenerateLevelInput,
  GenerateLevelResult,
};

export type AiProvider = {
  generateText(prompt: string): Promise<string>;
  generateJson<T>(prompt: string): Promise<T>;
  generateItemTable(input: GenerateItemsInput): Promise<GenerateItemsResult>;
  diagnoseLevel(input: DiagnoseLevelInput): Promise<DiagnoseLevelResult>;
  generateAssetPrompt(
    input: GenerateAssetPromptInput,
  ): Promise<GenerateAssetPromptResult>;
  generateImageAsset(input: GenerateAssetImageInput): Promise<GenerateAssetImageResult>;
  generateLevelCandidates(input: GenerateLevelInput): Promise<GenerateLevelResult>;
};
