import { GoogleGenAI } from "@google/genai";

type Params = {
  apiKey: string;
  referenceBytes: Buffer;
  referenceMimeType: string;
  userHint?: string;
  useMock?: boolean;
};

// 当前项目的 Image 生成走文生图流程；这里用 Vision 抽取一致性风格块（英文 prompt）。
export async function generateStyleBibleFromReference(params: Params): Promise<{
  stylePrompt: string;
  negativePrompt: string;
  styleBibleJson: unknown;
}> {
  if (params.useMock) {
    return {
      stylePrompt:
        "stylized 3D cartoon mobile puzzle game item asset, soft toy-like material, clean shape, centered object, orthographic camera, consistent studio lighting, simple readable silhouette, large round eyes, minimal face, clean background, no text, no watermark",
      negativePrompt:
        "text, watermark, logo, human, character, complex background, messy scene, realistic photo, horror, gore, weapon, low quality, blurry, distorted object",
      styleBibleJson: { mode: "mock" },
    };
  }

  const client = new GoogleGenAI({ apiKey: params.apiKey });
  const model = "gemini-1.5-pro"; // 这里用较稳的通用多模态模型；若不可用会在上层降级
  const base64 = params.referenceBytes.toString("base64");

  const referencePart = {
    inlineData: {
      data: base64,
      mimeType: params.referenceMimeType,
    },
  };

  const hint = params.userHint ? `用户补充：${params.userHint}` : "";

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
        parts: [referencePart as never, { text: prompt } as never],
      },
    ],
  });

  // @google/genai 返回结构随模型略有差异，这里保守解析
  type GenerateContentTextResponse = {
    response?: { text?: (() => string) | string };
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  const typedResp = response as unknown as GenerateContentTextResponse;

  const rawFromResponse =
    typeof typedResp.response?.text === "function" ? typedResp.response.text() : typedResp.response?.text;
  const rawFromCandidates = typedResp.candidates?.[0]?.content?.parts?.[0]?.text;
  const raw = typeof rawFromResponse === "string" ? rawFromResponse : rawFromCandidates ?? "";

  try {
    const parsed = JSON.parse(raw) as { stylePrompt: string; negativePrompt: string; styleBibleJson: unknown };
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

