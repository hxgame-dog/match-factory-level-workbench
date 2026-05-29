import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { updateAssetPromptSchema } from "@/lib/validators/asset";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const input = updateAssetPromptSchema.parse(body);
    const updated = await prisma.generatedAsset.update({
      where: { id },
      data: {
        prompt: input.prompt,
        negativePrompt: input.negativePrompt,
        status: "prompt_ready",
      },
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "更新 prompt 失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
