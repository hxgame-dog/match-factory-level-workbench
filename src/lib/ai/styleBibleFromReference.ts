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
        "3D 卡通手游道具美术风格，哑光塑料/软玩具质感，圆润干净的造型，柔和均匀的影棚布光，正交镜头，清晰可读的轮廓，明亮饱和的配色，大而圆的眼睛、简洁可爱的表情，纯净背景，无文字、无水印",
      negativePrompt:
        "文字, 水印, logo, 真人, 角色, 复杂背景, 杂乱场景, 写实照片, 恐怖, 血腥, 武器, 低清晰度, 模糊, 变形",
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
    "你是 3D 手游道具出图的美术风格顾问。请只从参考图中提取【美术风格】，用于后续生成其它道具。",
    "重要：绝对不要描述参考图里出现的具体物体、题材或物种（例如不要写鱼、河豚、动物、水果等），只描述风格本身。",
    "需要提取的风格要素：渲染方式（3D/卡通）、材质与质感（如哑光塑料、软玩具、黏土）、光照（方向/柔和度/影棚感）、镜头（正交/透视）、描边、轮廓与体块、配色倾向、眼睛与表情的处理风格、背景处理。",
    "输出需满足：",
    "1) stylePrompt：一段【中文】风格描述（60-150 字），可直接拼接到其它道具的出图提示词中，只含风格、不含任何具体物体。",
    "2) negativePrompt：中文负面词，避免文字/水印/复杂背景/真人/写实照片/低清晰度等。",
    "3) styleBibleJson：用 JSON 描述关键风格要素（material、lighting、camera、outline、colorTendency、eyeStyle、background、forbidden）。",
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
        "3D 卡通手游道具美术风格，哑光塑料/软玩具质感，圆润干净的造型，柔和均匀的影棚布光，正交镜头，清晰可读的轮廓，明亮饱和的配色，大而圆的眼睛、简洁可爱的表情，纯净背景，无文字、无水印",
      negativePrompt:
        "文字, 水印, logo, 真人, 角色, 复杂背景, 杂乱场景, 写实照片, 恐怖, 血腥, 武器, 低清晰度, 模糊, 变形",
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
