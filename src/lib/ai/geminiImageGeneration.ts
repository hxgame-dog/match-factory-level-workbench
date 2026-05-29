import { mkdir, writeFile } from "fs/promises";
import path from "path";

import { GoogleGenAI } from "@google/genai";

import { isImageCapableModel, isTextCapableModel } from "@/lib/ai/geminiRuntime";

function safeName(text: string) {
  return text.replace(/[^a-zA-Z0-9-_]/g, "_").slice(0, 48);
}

function parseImageSize(size: string): { width: number; height: number } {
  const [w, h] = size.split("x").map((v) => Number(v));
  if (w > 0 && h > 0) return { width: w, height: h };
  return { width: 512, height: 512 };
}

function aspectRatioFromSize(size: string): string {
  const { width, height } = parseImageSize(size);
  if (width === height) return "1:1";
  if (width > height) return "16:9";
  return "9:16";
}

async function saveImageBytes(bytes: Buffer, mimeType: string | undefined, baseName: string) {
  const ext = mimeType?.includes("png") ? "png" : mimeType?.includes("jpeg") || mimeType?.includes("jpg") ? "jpg" : "png";
  const dir = path.join(process.cwd(), "public", "generated-assets", "gemini");
  await mkdir(dir, { recursive: true });
  const fileName = `${safeName(baseName)}_${Date.now()}.${ext}`;
  const absolutePath = path.join(dir, fileName);
  await writeFile(absolutePath, bytes);
  return {
    imageUrl: `/generated-assets/gemini/${fileName}`,
    localPath: absolutePath,
  };
}

async function persistImageBytes(bytes: Buffer, mimeType: string | undefined, baseName: string) {
  const resolvedMime = mimeType ?? "image/png";
  try {
    return await saveImageBytes(bytes, resolvedMime, baseName);
  } catch {
    const b64 = bytes.toString("base64");
    return {
      imageUrl: `data:${resolvedMime};base64,${b64}`,
      localPath: "",
    };
  }
}

function extractImageBytesFromGenerateContent(response: {
  candidates?: Array<{
    content?: { parts?: Array<{ inlineData?: { data?: string; mimeType?: string } }> };
  }>;
}): { bytes: Buffer; mimeType?: string } | null {
  const parts = response.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    const data = part.inlineData?.data;
    if (data) {
      return {
        bytes: Buffer.from(data, "base64"),
        mimeType: part.inlineData?.mimeType,
      };
    }
  }
  return null;
}

export async function generateGeminiImage(input: {
  apiKey: string;
  model: string;
  prompt: string;
  negativePrompt?: string;
  imageSize?: string;
  itemName?: string;
}): Promise<{ imageUrl: string; localPath: string; model: string }> {
  const client = new GoogleGenAI({ apiKey: input.apiKey });
  const modelId = input.model.replace(/^models\//, "");
  const fullPrompt = input.negativePrompt?.trim()
    ? `${input.prompt}\n\nAvoid: ${input.negativePrompt}`
    : input.prompt;

  if (modelId.toLowerCase().includes("imagen")) {
    const response = await client.models.generateImages({
      model: modelId,
      prompt: fullPrompt,
      config: {
        numberOfImages: 1,
        aspectRatio: aspectRatioFromSize(input.imageSize ?? "512x512"),
      },
    });
    const imageBytes = response.generatedImages?.[0]?.image?.imageBytes;
    if (!imageBytes) {
      throw new Error("Imagen 未返回图片数据");
    }
    const buffer = Buffer.isBuffer(imageBytes) ? imageBytes : Buffer.from(imageBytes as string, "base64");
    const saved = await persistImageBytes(buffer, "image/png", input.itemName ?? "asset");
    return { ...saved, model: modelId };
  }

  const response = await client.models.generateContent({
    model: modelId,
    contents: fullPrompt,
    config: {
      responseModalities: ["IMAGE"],
    },
  });

  const extracted = extractImageBytesFromGenerateContent(response as never);
  if (!extracted) {
    throw new Error("模型未返回图片，请确认所选模型支持图像输出（如 gemini-2.5-flash-image 或 Imagen）");
  }
  const saved = await persistImageBytes(extracted.bytes, extracted.mimeType, input.itemName ?? "asset");
  return { ...saved, model: modelId };
}

export type ListedGeminiModel = {
  name: string;
  displayName?: string;
  description?: string;
  imageCapable: boolean;
  textCapable: boolean;
};

export async function listGeminiModels(apiKey: string): Promise<ListedGeminiModel[]> {
  const client = new GoogleGenAI({ apiKey });
  const pager = await client.models.list();
  const rows: ListedGeminiModel[] = [];

  for await (const model of pager) {
    const name = (model.name ?? "").replace(/^models\//, "");
    if (!name) continue;
    rows.push({
      name,
      displayName: model.displayName,
      description: model.description,
      imageCapable: isImageCapableModel(name),
      textCapable: isTextCapableModel(name),
    });
  }

  return rows.sort((a, b) => a.name.localeCompare(b.name));
}
