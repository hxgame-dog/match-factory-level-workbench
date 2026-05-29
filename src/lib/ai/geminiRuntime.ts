import { cookies } from "next/headers";

import { env } from "@/lib/env";

export const GEMINI_API_KEY_COOKIE = "mf_gemini_api_key";
export const GEMINI_TEXT_MODEL_COOKIE = "mf_gemini_text_model";
export const GEMINI_IMAGE_MODEL_COOKIE = "mf_gemini_image_model";

export type GeminiRuntime = {
  apiKey?: string;
  textModel: string;
  imageModel: string;
  hasApiKey: boolean;
  keySource: "env" | "session" | "none";
  keyHint?: string;
};

export function maskApiKey(key: string): string {
  const trimmed = key.trim();
  if (trimmed.length <= 8) return "********";
  return `${trimmed.slice(0, 4)}…${trimmed.slice(-4)}`;
}

export async function getGeminiRuntime(): Promise<GeminiRuntime> {
  const cookieStore = await cookies();
  const sessionKey = cookieStore.get(GEMINI_API_KEY_COOKIE)?.value?.trim();
  const envKey = env.GEMINI_API_KEY?.trim();
  const apiKey = sessionKey || envKey || undefined;

  const textModel =
    cookieStore.get(GEMINI_TEXT_MODEL_COOKIE)?.value?.trim() || env.GEMINI_TEXT_MODEL;
  const imageModel =
    cookieStore.get(GEMINI_IMAGE_MODEL_COOKIE)?.value?.trim() || env.GEMINI_IMAGE_MODEL;

  let keySource: GeminiRuntime["keySource"] = "none";
  if (sessionKey) keySource = "session";
  else if (envKey) keySource = "env";

  return {
    apiKey,
    textModel,
    imageModel,
    hasApiKey: Boolean(apiKey),
    keySource,
    keyHint: apiKey ? maskApiKey(apiKey) : undefined,
  };
}

export function isImageCapableModel(modelName: string): boolean {
  const name = modelName.toLowerCase();
  return (
    name.includes("imagen") ||
    name.includes("image") ||
    name.includes("flash-image") ||
    name.endsWith("-image")
  );
}

export function isTextCapableModel(modelName: string): boolean {
  const name = modelName.toLowerCase();
  if (name.includes("embedding")) return false;
  if (name.includes("imagen") && !name.includes("gemini")) return false;
  return name.includes("gemini") || name.includes("flash") || name.includes("pro");
}
