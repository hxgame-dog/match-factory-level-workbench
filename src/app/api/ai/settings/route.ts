import { NextResponse } from "next/server";

import {
  GEMINI_API_KEY_COOKIE,
  GEMINI_IMAGE_MODEL_COOKIE,
  GEMINI_TEXT_MODEL_COOKIE,
  getGeminiRuntime,
  maskApiKey,
} from "@/lib/ai/geminiRuntime";
import { env } from "@/lib/env";
import { geminiSettingsUpdateSchema } from "@/lib/validators/geminiSettings";

const secureCookie = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};

const prefCookie = {
  httpOnly: false,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};

export async function GET() {
  try {
    const runtime = await getGeminiRuntime();
    return NextResponse.json({
      success: true,
      data: {
        hasGeminiKey: runtime.hasApiKey,
        keySource: runtime.keySource,
        keyHint: runtime.keyHint,
        textModel: runtime.textModel,
        imageModel: runtime.imageModel,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "读取设置失败" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = geminiSettingsUpdateSchema.parse(body);
    const before = await getGeminiRuntime();

    let hasKey = before.hasApiKey;
    let keySource = before.keySource;
    let keyHint = before.keyHint;

    if (payload.clearKey) {
      hasKey = Boolean(env.GEMINI_API_KEY);
      keySource = env.GEMINI_API_KEY ? "env" : "none";
      keyHint = env.GEMINI_API_KEY ? maskApiKey(env.GEMINI_API_KEY) : undefined;
    } else if (payload.apiKey) {
      hasKey = true;
      keySource = "session";
      keyHint = maskApiKey(payload.apiKey);
    }

    const textModel = payload.textModel?.trim() || before.textModel;
    const imageModel = payload.imageModel?.trim() || before.imageModel;

    const res = NextResponse.json({
      success: true,
      data: {
        hasGeminiKey: hasKey,
        keySource,
        keyHint,
        textModel,
        imageModel,
      },
    });

    if (payload.clearKey) {
      res.cookies.set(GEMINI_API_KEY_COOKIE, "", { ...secureCookie, maxAge: 0 });
    } else if (payload.apiKey) {
      res.cookies.set(GEMINI_API_KEY_COOKIE, payload.apiKey.trim(), secureCookie);
    }

    if (payload.textModel) {
      res.cookies.set(GEMINI_TEXT_MODEL_COOKIE, textModel, prefCookie);
    }
    if (payload.imageModel) {
      res.cookies.set(GEMINI_IMAGE_MODEL_COOKIE, imageModel, prefCookie);
    }

    return res;
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "保存设置失败" },
      { status: 400 },
    );
  }
}
