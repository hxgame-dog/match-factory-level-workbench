import { GoogleGenAI } from "@google/genai";

import { resolveStyleAnalysisModel } from "@/lib/ai/geminiRuntime";
import type { GeminiRuntime } from "@/lib/ai/geminiRuntime";

type Params = {
  apiKey: string;
  runtime: Pick<GeminiRuntime, "imageModel" | "textModel">;
  referenceBytes: Buffer;
  referenceMimeType: string;
  userHint?: string;
  useMock?: boolean;
};

function parseStyleBibleText(raw: string): {
  stylePrompt: string;
  negativePrompt: string;
  styleBibleJson: unknown;
} {
  const trimmed = raw.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  const jsonText = jsonMatch?.[0] ?? trimmed;
  try {
    const parsed = JSON.parse(jsonText) as {
      stylePrompt: string;
      negativePrompt: string;
      styleBibleJson: unknown;
    };
    return parsed;
  } catch {
    return {
      stylePrompt:
        "stylized 3D cartoon mobile puzzle game item asset, soft toy-like material, clean shape, centered object, orthographic camera, consistent studio lighting, simple readable silhouette, large round eyes, minimal face, clean background, no text, no watermark",
      negativePrompt:
        "text, watermark, logo, human, character, complex background, messy scene, realistic photo, horror, gore, weapon, low quality, blurry, distorted object",
      styleBibleJson: { parseError: true, rawPreview: raw.slice(0, 200) },
    };
  }
}

function extractTextFromResponse(response: unknown): string {
  type GenerateContentTextResponse = {
    text?: string;
    response?: { text?: (() => string) | string };
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const typedResp = response as GenerateContentTextResponse;
  if (typeof typedResp.text === "string") return typedResp.text;
  const rawFromResponse =
    typeof typedResp.response?.text === "function"
      ? typedResp.response.text()
      : typedResp.response?.text;
  const rawFromCandidates = typedResp.candidates?.[0]?.content?.parts?.[0]?.text;
  return typeof rawFromResponse === "string" ? rawFromResponse : rawFromCandidates ?? "";
}

async function callVisionModel(
  client: GoogleGenAI,
  model: string,
  referenceBytes: Buffer,
  referenceMimeType: string,
  userHint?: string,
) {
  const base64 = referenceBytes.toString("base64");
  const hint = userHint ? `用户补充：${userHint}` : "";
  const prompt = [
    "你是 3D 手游道具出图风格顾问。根据用户上传的参考图，提取一段可复用的英文 Style Prompt 和负面词。输出需满足：",
    "1) Style Prompt：50-120 个英文单词，强调 single object、centered、clean/transparent background、一致材质（哑光塑料感/软玩具感）、光照、镜头、轮廓、眼睛/脸部特征（如有）、无文字无水印。",
    "2) Negative Prompt：给出避免出现文字/水印/复杂背景/真人/低清晰度等的英文负面词。",
    "3) styleBibleJson：用 JSON 描述关键视觉要素（材质、光照、镜头、禁用项、轮廓与配色范围）。",
    hint,
    "输出严格 JSON（无 Markdown），字段：stylePrompt, negativePrompt, styleBibleJson。",
  ]
    .filter(Boolean)
    .join("\n");

  const response = await client.models.generateContent({
    model,
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              data: base64,
              mimeType: referenceMimeType,
            },
          },
          { text: prompt },
        ],
      },
    ],
  });

  return parseStyleBibleText(extractTextFromResponse(response));
}

function isModelNotFoundError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("404") || message.includes("NOT_FOUND") || message.includes("not found");
}

export async function generateStyleBibleFromReference(params: Params): Promise<{
  stylePrompt: string;
  negativePrompt: string;
  styleBibleJson: unknown;
  modelUsed: string;
}> {
  if (params.useMock) {
    return {
      stylePrompt:
        "stylized 3D cartoon mobile puzzle game item asset, soft toy-like material, clean shape, centered object, orthographic camera, consistent studio lighting, simple readable silhouette, large round eyes, minimal face, clean background, no text, no watermark",
      negativePrompt:
        "text, watermark, logo, human, character, complex background, messy scene, realistic photo, horror, gore, weapon, low quality, blurry, distorted object",
      styleBibleJson: { mode: "mock" },
      modelUsed: "mock",
    };
  }

  const client = new GoogleGenAI({ apiKey: params.apiKey });
  const { primary, fallback } = resolveStyleAnalysisModel(params.runtime);

  try {
    const result = await callVisionModel(
      client,
      primary,
      params.referenceBytes,
      params.referenceMimeType,
      params.userHint,
    );
    return { ...result, modelUsed: primary };
  } catch (error) {
    if (fallback && isModelNotFoundError(error)) {
      const result = await callVisionModel(
        client,
        fallback,
        params.referenceBytes,
        params.referenceMimeType,
        params.userHint,
      );
      return { ...result, modelUsed: fallback };
    }
    throw error;
  }
}
