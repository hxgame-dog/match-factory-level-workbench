import { GoogleGenAI } from "@google/genai";

import { env } from "@/lib/env";
import { generateGeminiImageWithReference } from "@/lib/ai/geminiImageGeneration";
import { getGeminiRuntime, type GeminiRuntime } from "@/lib/ai/geminiRuntime";
import { generateMockAssetImage } from "@/lib/assets/mockImage";
import { estimateBasicDifficulty } from "@/lib/level/estimateDifficulty";
import { prisma } from "@/lib/prisma";
import {
  createGenerateItemsResultSchema,
  diagnoseLevelInputSchema,
  diagnoseLevelResultSchema,
  generateAssetPromptInputSchema,
  generateAssetPromptResultSchema,
  generateItemsInputSchema,
} from "@/lib/validators/ai";
import { geminiDifficultyAdviceResultSchema } from "@/lib/validators/difficulty";
import type {
  DiagnoseLevelInput,
  DiagnoseLevelResult,
  GenerateAssetPromptInput,
  GenerateAssetPromptResult,
  GenerateItemChunkInput,
  GenerateItemsInput,
  GenerateItemsResult,
} from "@/types/ai";
import type { GenerateAssetImageInput, GenerateAssetImageResult } from "@/types/asset";
import type { GeminiDifficultyAdviceInput, GeminiDifficultyAdviceResult } from "@/types/difficulty";
import type { GeminiPlaytestAdviceInput, GeminiPlaytestAdviceResult } from "@/types/playtest";
import type { GeminiAnalyticsAdviceInput, GeminiAnalyticsAdviceResult } from "@/types/analytics";
import type { AutoGenerateLevelsInput, SourceLevelPatternAnalysis } from "@/types/autoLevel";
import type { GenerateLevelInput, GenerateLevelResult, LevelConfig } from "@/types/level";
import { generateLevelResultSchema } from "@/lib/validators/level";

import { diagnoseDifficultyAdvicePrompt, diagnoseLevelPrompt } from "./prompts/diagnoseLevelPrompt";
import { autoGenerateLevelsPrompt } from "./prompts/autoGenerateLevelsPrompt";
import { playtestAdvicePrompt } from "./prompts/playtestAdvicePrompt";
import { analyticsFeedbackAdvicePrompt } from "./prompts/analyticsFeedbackAdvicePrompt";
import { generateAssetPromptText } from "./prompts/generateAssetPrompt";
import { generateLevelPrompt } from "./prompts/generateLevelPrompt";
import { buildMockFreeItems, finalizeFreeGeneratedItems } from "./finalizeFreeGeneratedItems";
import { generateItemTableInBatches } from "./generateItemTableInBatches";
import { generateItemsPrompt } from "./prompts/generateItemsPrompt";
import {
  ITEM_GENERATION_CHUNK_SIZE,
  computeExpectedTotal,
  usesColorExpansion,
} from "@/lib/items/itemGenerationLimits";
import { geminiPlaytestAdviceResultSchema } from "@/lib/validators/playtest";
import { geminiAnalyticsAdviceResultSchema } from "@/lib/validators/analytics";

function extractJsonText(text: string): string {
  const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/```$/, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return cleaned.slice(start, end + 1);
  }
  return cleaned;
}

function parseJsonSafe<T>(text: string): T {
  const jsonText = extractJsonText(text);
  return JSON.parse(jsonText) as T;
}

function buildMockDiagnosis(): DiagnoseLevelResult {
  return {
    score: {
      itemComplexity: 0.52,
      ruleDifficulty: 0.48,
      timePressure: 0.45,
      finalDifficulty: 0.5,
      difficultyLabel: "中等",
    },
    risks: ["目标物与干扰物颜色接近，可能造成误触。"],
    suggestions: ["提高目标物饱和度", "减少同轮廓干扰物数量"],
    explanation: "当前配置适合新手进阶阶段，建议轻微降低视觉混淆度。",
  };
}

function buildMockAssetPrompt(): GenerateAssetPromptResult {
  return {
    prompt:
      "single stylized 3d cartoon mobile puzzle game item asset, centered object, clean or transparent background, consistent lighting, readable silhouette, no text, no watermark, production-ready asset",
    negativePrompt:
      "text, watermark, logo, human, character, complex background, realistic photo, blurry, low quality",
    notes: "mock prompt",
  };
}

function buildMockLevelCandidates(input: GenerateLevelInput): GenerateLevelResult {
  const targets = input.items.filter((item) => item.role === "target");
  const distractors = input.items.filter((item) => item.role === "distractor");
  const candidates: LevelConfig[] = Array.from({ length: input.candidateCount }).map((_, idx) => {
    const difficultyFactor =
      input.targetDifficulty === "easy"
        ? 0.9
        : input.targetDifficulty === "normal"
          ? 1
          : input.targetDifficulty === "hard"
            ? 1.2
            : 1.35;
    const spawnTargets = targets.map((item) => ({ ...item, count: Math.max(item.count, Math.round(item.count * 1.2 * difficultyFactor)), assetKey: item.name }));
    const spawnDistractors = distractors
      .slice(0, Math.max(1, Math.round(2 * difficultyFactor)))
      .map((item) => ({ ...item, count: Math.max(1, Math.round(item.count * difficultyFactor)), assetKey: item.name }));
    const level: LevelConfig = {
      levelId: `temp_candidate_${idx + 1}`,
      levelIndex: input.levelIndex ? input.levelIndex + idx : idx + 1,
      name: `${input.levelName} Candidate ${idx + 1}`,
      theme: "Generated Theme",
      source: {
        itemSetId: input.source.itemSetId,
        assetBatchId: input.source.assetBatchId,
        generatedBy: "mock",
      },
      meta: { version: 1, createdAt: new Date().toISOString(), notes: "mock generated candidate" },
      rules: {
        generatorRuleId: input.config.generatorRuleId,
        refreshRuleId: input.config.refreshRuleId,
        timeLimitSec: input.config.timeLimitSec,
        slotCount: input.config.slotCount,
        targetDifficulty: input.targetDifficulty,
      },
      board: {
        width: input.config.boardWidth,
        height: input.config.boardHeight,
        layerCount: input.config.layerCount,
        layoutMode: input.config.layoutMode,
      },
      targets: targets.map((item) => ({ ...item, role: "target", assetKey: item.name })),
      spawns: [...spawnTargets, ...spawnDistractors],
      assets: Object.fromEntries(
        (input.assets ?? []).map((asset) => [
          asset.name,
          { imageUrl: asset.imageUrl, localPath: asset.localPath, prompt: asset.prompt },
        ]),
      ),
    };
    const est = estimateBasicDifficulty({
      level,
      generatorRuleDifficulty: input.rulePresets.generatorRule.difficultyValue,
      refreshRuleDifficulty: input.rulePresets.refreshRule.difficultyValue,
    });
    level.diagnostics = {
      estimatedItemComplexity: est.itemComplexity,
      estimatedRuleDifficulty: est.ruleDifficulty,
      estimatedTimePressure: est.timePressure,
      estimatedFinalDifficulty: est.finalDifficulty,
      warnings: est.warnings,
      suggestions: est.suggestions,
    };
    return level;
  });
  return {
    summary: `Mock 模式生成了 ${candidates.length} 个候选关卡`,
    warnings: [],
    candidates,
  };
}

async function resolveRuntime(override?: Partial<GeminiRuntime>): Promise<GeminiRuntime> {
  const base = await getGeminiRuntime();
  return {
    ...base,
    ...override,
    apiKey: override?.apiKey ?? base.apiKey,
    textModel: override?.textModel ?? base.textModel,
    imageModel: override?.imageModel ?? base.imageModel,
    hasApiKey: Boolean(override?.apiKey ?? base.apiKey),
  };
}

function createClient(apiKey: string) {
  return new GoogleGenAI({ apiKey });
}

export async function generateText(
  prompt: string,
  options?: { runtime?: Partial<GeminiRuntime> },
): Promise<string> {
  const runtime = await resolveRuntime(options?.runtime);
  if (env.AI_MOCK_MODE && !runtime.hasApiKey) {
    return `Mock 模式返回：${prompt.slice(0, 60)}`;
  }
  if (!runtime.apiKey) {
    throw new Error("未配置 Gemini API Key。请在 AI 配置中心保存 Key（仅存于服务端 HttpOnly Cookie）或设置环境变量 GEMINI_API_KEY。");
  }

  const client = createClient(runtime.apiKey);
  const response = await client.models.generateContent({
    model: runtime.textModel,
    contents: prompt,
  });
  return response.text ?? "";
}

export async function generateJson<T>(prompt: string): Promise<T> {
  const text = await generateText(prompt);
  return parseJsonSafe<T>(text);
}

export async function generateItemTable(
  input: GenerateItemsInput,
): Promise<GenerateItemsResult> {
  const validInput = generateItemsInputSchema.parse(input);
  const expectedTotal = computeExpectedTotal(validInput.itemTypeCount, validInput.colorCount);
  const resultSchema = createGenerateItemsResultSchema(
    expectedTotal,
    validInput.itemTypeCount,
    validInput.colorCount,
  );

  try {
    const runtime = await resolveRuntime();
    const useMock = env.AI_MOCK_MODE && !runtime.hasApiKey;

    if (useMock) {
      const mock = resultSchema.parse(buildMockFreeItems(validInput));
      await prisma.aiGenerationLog.create({
        data: {
          type: "item_table",
          provider: "mock",
          model: env.GEMINI_TEXT_MODEL,
          prompt: `[MOCK] ${validInput.description}`,
          resultJson: JSON.stringify(mock),
          status: "success",
        },
      });
      return mock;
    }

    const rawMerged = await generateItemTableInBatches(validInput, async (chunkInput, batch) => {
      const prompt = generateItemsPrompt({
        ...chunkInput,
        batchIndex: batch.batchIndex,
        batchTotal: batch.batchTotal,
        existingNames: batch.existingNames,
      });
      const text = await generateText(prompt, { runtime });
      return parseJsonSafe<GenerateItemsResult>(text);
    });

    const finalized = finalizeFreeGeneratedItems(rawMerged, validInput);
    const validated = resultSchema.parse(finalized);

    await prisma.aiGenerationLog.create({
      data: {
        type: "item_table",
        provider: env.AI_PROVIDER,
        model: env.GEMINI_TEXT_MODEL,
        prompt: validInput.description,
        resultJson: JSON.stringify({ itemCount: validated.items.length, expectedTotal }),
        status: "success",
      },
    });

    return validated;
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI 道具生成失败";
    await prisma.aiGenerationLog.create({
      data: {
        type: "item_table",
        provider: env.AI_PROVIDER,
        model: env.GEMINI_TEXT_MODEL,
        prompt: input.description,
        status: "failed",
        error: message,
      },
    });
    throw new Error(`AI 道具生成失败: ${message}`);
  }
}

function buildMockChunk(input: GenerateItemChunkInput): GenerateItemsResult {
  const conventionalColors = ["red", "orange", "blue", "green", "yellow", "purple", "pink", "gray"];
  const patterns = ["纯色", "纵纹", "斑点"];
  const offset = input.batchIndex * ITEM_GENERATION_CHUNK_SIZE;
  const items = Array.from({ length: input.chunkTypeCount }, (_, i) => {
    const n = offset + i + 1;
    return {
      name: `mock_item_${n}`,
      displayName: `示例道具${n}`,
      category1: "mock_category",
      color1: usesColorExpansion(input.colorCount)
        ? undefined
        : conventionalColors[n % conventionalColors.length],
      color2: "cream",
      pattern: patterns[n % patterns.length],
      moveSpeed: (n % 5) + 1,
      count: 9,
      isNew: true,
      imagePrompt: `single stylized 3D cartoon ${input.description} game item ${n}, centered, clean background`,
      reason: `Mock 基础造型 ${n}`,
      riskTags: [] as string[],
    };
  });
  return {
    summary: `Mock：第 ${input.batchIndex + 1}/${input.batchTotal} 批，共 ${items.length} 种基础造型`,
    warnings: ["当前为 Mock 输出，未调用 Gemini。"],
    items,
  };
}

/** 前端编排分批：仅生成一批基础造型（≤ChunkSize 种），不展开颜色、不编号 */
export async function generateItemChunk(
  input: GenerateItemChunkInput,
): Promise<GenerateItemsResult> {
  const runtime = await resolveRuntime();
  if (env.AI_MOCK_MODE && !runtime.hasApiKey) {
    return buildMockChunk(input);
  }

  const prompt = generateItemsPrompt({
    setName: input.setName,
    description: input.description,
    itemTypeCount: input.chunkTypeCount,
    colorCount: input.colorCount,
    batchIndex: input.batchIndex,
    batchTotal: input.batchTotal,
    existingNames: input.existingNames,
  });
  const text = await generateText(prompt, { runtime });
  const raw = parseJsonSafe<Partial<GenerateItemsResult>>(text);
  return {
    summary: raw.summary ?? "",
    warnings: Array.isArray(raw.warnings) ? raw.warnings : [],
    items: Array.isArray(raw.items) ? raw.items : [],
  };
}

/** 前端编排分批：合并所有批次后做颜色展开、顺序编号与校验 */
export function finalizeGeneratedItemTable(input: {
  itemTypeCount: number;
  colorCount: number;
  summary: string;
  warnings: string[];
  items: GenerateItemsResult["items"];
}): GenerateItemsResult {
  // 分批编排时，同主题难以凑齐目标种类数（去重后会少于目标），此处只做结构校验，
  // 数量不足由 finalizeFreeGeneratedItems 降级为警告，不再硬性拒绝，避免丢弃已生成结果。
  const finalized = finalizeFreeGeneratedItems(
    {
      summary: input.summary || `共生成 ${input.items.length} 种物品（目标 ${input.itemTypeCount} 种）`,
      warnings: input.warnings,
      items: input.items,
    },
    { itemTypeCount: input.itemTypeCount, colorCount: input.colorCount },
  );
  return finalized;
}

export async function diagnoseLevel(
  input: DiagnoseLevelInput,
): Promise<DiagnoseLevelResult> {
  const validInput = diagnoseLevelInputSchema.parse(input);
  if (env.AI_MOCK_MODE) {
    return diagnoseLevelResultSchema.parse(buildMockDiagnosis());
  }

  const raw = await generateJson<unknown>(diagnoseLevelPrompt(validInput));
  return diagnoseLevelResultSchema.parse(raw);
}

export async function generateAssetPrompt(
  input: GenerateAssetPromptInput,
): Promise<GenerateAssetPromptResult> {
  const validInput = generateAssetPromptInputSchema.parse(input);
  if (env.AI_MOCK_MODE) {
    const mock = buildMockAssetPrompt();
    return generateAssetPromptResultSchema.parse({
      ...mock,
      prompt: `${mock.prompt}. item name: ${validInput.item.name}. category: ${validInput.item.category1}. style: ${validInput.globalArtStyle}`,
      negativePrompt: validInput.negativePrompt ?? mock.negativePrompt,
    });
  }

  const raw = await generateJson<unknown>(generateAssetPromptText(validInput));
  return generateAssetPromptResultSchema.parse(raw);
}

export async function generateImageAsset(
  input: GenerateAssetImageInput,
  options?: { runtime?: Partial<GeminiRuntime> },
): Promise<GenerateAssetImageResult> {
  const runtime = await resolveRuntime(options?.runtime);
  const useMock = input.provider === "mock" || (env.AI_MOCK_MODE && !runtime.hasApiKey);

  try {
    if (useMock) {
      const mock = await generateMockAssetImage(input);
      await prisma.aiGenerationLog.create({
        data: {
          type: "asset_image",
          provider: "mock",
          model: "mock-svg",
          prompt: input.prompt,
          resultJson: JSON.stringify(mock),
          status: "success",
        },
      });
      return {
        assetId: input.assetId ?? "temp",
        status: "done",
        imageUrl: mock.imageUrl,
        localPath: mock.localPath,
      };
    }

    if (!runtime.apiKey) {
      return {
        assetId: input.assetId ?? "temp",
        status: "failed",
        error: "未配置 Gemini API Key，无法生成真实图片",
      };
    }

    const generated = await generateGeminiImageWithReference({
      apiKey: runtime.apiKey,
      model: runtime.imageModel,
      prompt: input.prompt,
      negativePrompt: input.negativePrompt,
      imageSize: input.imageSize,
      itemName: input.item.name,
      referenceImageDataUrl: input.referenceImageDataUrl,
    });

    await prisma.aiGenerationLog.create({
      data: {
        type: "asset_image",
        provider: env.AI_PROVIDER,
        model: generated.model,
        prompt: input.prompt,
        resultJson: JSON.stringify({
          imageUrl: generated.imageUrl,
          localPath: generated.localPath,
          consistencyMode: generated.consistencyMode,
        }),
        status: "success",
      },
    });

    return {
      assetId: input.assetId ?? "temp",
      status: "done",
      imageUrl: generated.imageUrl,
      localPath: generated.localPath,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "图片生成失败";
    await prisma.aiGenerationLog.create({
      data: {
        type: "asset_image",
        provider: useMock ? "mock" : env.AI_PROVIDER,
        model: runtime.imageModel,
        prompt: input.prompt,
        status: "failed",
        error: message,
      },
    });
    return {
      assetId: input.assetId ?? "temp",
      status: "failed",
      error: message,
    };
  }
}

export async function generateLevelCandidates(
  input: GenerateLevelInput,
): Promise<GenerateLevelResult> {
  try {
    if (env.AI_MOCK_MODE) {
      const mock = generateLevelResultSchema.parse(buildMockLevelCandidates(input));
      await prisma.aiGenerationLog.create({
        data: {
          type: "level_candidates",
          provider: "mock",
          model: env.GEMINI_TEXT_MODEL,
          prompt: `[MOCK] ${input.levelName}`,
          resultJson: JSON.stringify(mock),
          status: "success",
        },
      });
      return mock;
    }
    const prompt = generateLevelPrompt(input);
    const text = await generateText(prompt);
    const parsed = parseJsonSafe<unknown>(text);
    const validated = generateLevelResultSchema.parse(parsed);
    await prisma.aiGenerationLog.create({
      data: {
        type: "level_candidates",
        provider: env.AI_PROVIDER,
        model: env.GEMINI_TEXT_MODEL,
        prompt,
        resultJson: JSON.stringify(validated),
        status: "success",
      },
    });
    return validated;
  } catch (error) {
    const message = error instanceof Error ? error.message : "关卡候选生成失败";
    await prisma.aiGenerationLog.create({
      data: {
        type: "level_candidates",
        provider: env.AI_PROVIDER,
        model: env.GEMINI_TEXT_MODEL,
        prompt: input.levelName,
        status: "failed",
        error: message,
      },
    });
    throw new Error(message);
  }
}

export async function generateDifficultyAdvice(
  input: GeminiDifficultyAdviceInput,
): Promise<GeminiDifficultyAdviceResult> {
  try {
    if (env.AI_MOCK_MODE) {
      const label = input.diagnosis.score.label;
      return geminiDifficultyAdviceResultSchema.parse({
        summary: `Mock 建议：当前关卡难度为 ${label}，建议针对高风险项进行平衡。`,
        risks: input.diagnosis.warnings.slice(0, 5),
        suggestions: [
          {
            priority: "high",
            title: "降低高相似度干扰",
            detail: "减少同色同形干扰物数量，或增强目标物对比度。",
            expectedEffect: "降低识别误触，减少无效操作。",
          },
          {
            priority: "medium",
            title: "平滑时间压力",
            detail: "适当增加 timeLimitSec 或减少 spawn 总量。",
            expectedEffect: "降低时间焦虑，提升可完成率。",
          },
        ],
        balancingAdvice: "优先处理高相似度与时间压力，再微调规则难度。",
      });
    }
    const prompt = diagnoseDifficultyAdvicePrompt(input);
    const text = await generateText(prompt);
    const parsed = parseJsonSafe<unknown>(text);
    const validated = geminiDifficultyAdviceResultSchema.parse(parsed);
    await prisma.aiGenerationLog.create({
      data: {
        type: "difficulty_advice",
        provider: env.AI_PROVIDER,
        model: env.GEMINI_TEXT_MODEL,
        prompt,
        resultJson: JSON.stringify(validated),
        status: "success",
      },
    });
    return validated;
  } catch (error) {
    const message = error instanceof Error ? error.message : "难度建议生成失败";
    await prisma.aiGenerationLog.create({
      data: {
        type: "difficulty_advice",
        provider: env.AI_PROVIDER,
        model: env.GEMINI_TEXT_MODEL,
        prompt: "difficulty_advice",
        status: "failed",
        error: message,
      },
    });
    throw new Error(message);
  }
}

export async function generateAutoLevelCandidates(input: {
  request: AutoGenerateLevelsInput;
  sourceAnalysis: SourceLevelPatternAnalysis;
  target: { levelIndex: number; targetP: number; label: string; reason: string };
  sourceLevels: LevelConfig[];
  availableItems: unknown[];
}): Promise<{ candidates: LevelConfig[]; reason: string; warnings: string[] }> {
  if (env.AI_MOCK_MODE) {
    return {
      candidates: [],
      reason: "Mock 模式下使用本地候选构建器，Gemini 候选为空。",
      warnings: [],
    };
  }
  try {
    const prompt = autoGenerateLevelsPrompt(input);
    const text = await generateText(prompt);
    const parsed = parseJsonSafe<unknown>(text) as { candidates?: LevelConfig[]; reason?: string; warnings?: string[] };
    return {
      candidates: Array.isArray(parsed.candidates) ? parsed.candidates : [],
      reason: parsed.reason ?? "Gemini 候选生成成功",
      warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gemini 自动续关生成失败";
    return {
      candidates: [],
      reason: "Gemini 生成失败，已回退本地候选策略。",
      warnings: [message],
    };
  }
}

export async function generatePlaytestAdvice(
  input: GeminiPlaytestAdviceInput,
): Promise<GeminiPlaytestAdviceResult> {
  try {
    if (env.AI_MOCK_MODE) {
      return geminiPlaytestAdviceResultSchema.parse({
        summary: `Mock 试玩建议：当前通关率 ${Math.round(input.playtestResult.metrics.passRate * 100)}%，建议优先处理高风险 QA 问题。`,
        keyFindings: input.playtestResult.qaIssues.slice(0, 3).map((x) => `${x.code}:${x.title}`),
        riskLevel: input.playtestResult.qaIssues.some((x) => x.severity === "critical")
          ? "critical"
          : input.playtestResult.qaIssues.some((x) => x.severity === "high")
            ? "high"
            : input.playtestResult.qaIssues.length
              ? "medium"
              : "low",
        suggestions: input.playtestResult.balanceSuggestions.slice(0, 4).map((s) => ({
          priority: s.priority,
          action: s.action,
          detail: s.detail,
          expectedImpact: s.expectedEffect,
        })),
        designerNotes: "先修复 critical/high 问题，再微调关卡节奏。",
      });
    }
    const prompt = playtestAdvicePrompt(input);
    const text = await generateText(prompt);
    const parsed = parseJsonSafe<unknown>(text);
    const validated = geminiPlaytestAdviceResultSchema.parse(parsed);
    await prisma.aiGenerationLog.create({
      data: {
        type: "playtest_advice",
        provider: env.AI_PROVIDER,
        model: env.GEMINI_TEXT_MODEL,
        prompt,
        resultJson: JSON.stringify(validated),
        status: "success",
      },
    });
    return validated;
  } catch (error) {
    const message = error instanceof Error ? error.message : "试玩建议生成失败";
    await prisma.aiGenerationLog.create({
      data: {
        type: "playtest_advice",
        provider: env.AI_PROVIDER,
        model: env.GEMINI_TEXT_MODEL,
        prompt: "playtest_advice",
        status: "failed",
        error: message,
      },
    });
    throw new Error(message);
  }
}

export async function generateAnalyticsFeedbackAdvice(
  input: GeminiAnalyticsAdviceInput,
): Promise<GeminiAnalyticsAdviceResult> {
  try {
    if (env.AI_MOCK_MODE) {
      const diag = input.feedbackDiagnosis;
      const lowConfidence = diag.dataQuality.confidence === "low";
      return geminiAnalyticsAdviceResultSchema.parse({
        summary: `Mock 分析：真实通关率 ${diag.analytics.passRate !== undefined ? `${Math.round(diag.analytics.passRate * 100)}%` : "未知"}，整体风险 ${diag.severity}。`,
        keyFindings: [
          ...diag.issueTags.map((tag) => `命中标签: ${tag}`),
          lowConfidence ? "样本量偏低，结论需谨慎" : "样本量足够，可信度较好",
        ],
        rootCauseHypotheses: [
          {
            title: lowConfidence ? "样本不足导致波动" : diag.issueTags.includes("too_hard_real") ? "关卡确实偏难" : "表现基本符合预期",
            confidence: lowConfidence ? "low" : "medium",
            detail: "基于真实数据与公式/模拟对比得到的初步判断。",
          },
        ],
        optimizationSuggestions: diag.suggestions.slice(0, 4).map((s) => ({
          priority: s.priority,
          action: s.action,
          detail: s.detail,
          expectedMetricImpact: s.expectedEffect,
        })),
        formulaCalibrationNotes: diag.comparison.formulaVsAnalytics?.message ?? "公式与真实表现暂无明显偏差。",
        playtestCalibrationNotes: diag.comparison.playtestVsAnalytics?.message ?? "模拟与真实表现暂无明显偏差。",
      });
    }
    const prompt = analyticsFeedbackAdvicePrompt(input);
    const text = await generateText(prompt);
    const parsed = parseJsonSafe<unknown>(text);
    const validated = geminiAnalyticsAdviceResultSchema.parse(parsed);
    await prisma.aiGenerationLog.create({
      data: {
        type: "analytics_advice",
        provider: env.AI_PROVIDER,
        model: env.GEMINI_TEXT_MODEL,
        prompt,
        resultJson: JSON.stringify(validated),
        status: "success",
      },
    });
    return validated;
  } catch (error) {
    const message = error instanceof Error ? error.message : "玩家数据建议生成失败";
    await prisma.aiGenerationLog.create({
      data: {
        type: "analytics_advice",
        provider: env.AI_PROVIDER,
        model: env.GEMINI_TEXT_MODEL,
        prompt: "analytics_advice",
        status: "failed",
        error: message,
      },
    });
    throw new Error(message);
  }
}

export async function getAiStatus() {
  const runtime = await getGeminiRuntime();
  return {
    provider: env.AI_PROVIDER,
    textModel: runtime.textModel,
    imageModel: runtime.imageModel,
    mockMode: env.AI_MOCK_MODE && !runtime.hasApiKey,
    hasGeminiKey: runtime.hasApiKey,
    keySource: runtime.keySource,
    keyHint: runtime.keyHint,
    imageGenerationReady: runtime.hasApiKey,
  };
}
