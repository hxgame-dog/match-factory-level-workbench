import { NextResponse } from "next/server";
import { z } from "zod";

import { buildBoardPreview } from "@/lib/level/buildBoardPreview";
import { levelConfigSchema } from "@/lib/validators/level";

const payloadSchema = z.object({
  level: levelConfigSchema,
  seed: z.string().optional(),
  filter: z
    .object({
      role: z.enum(["target", "distractor", "filler", "special"]).optional(),
      layer: z.number().int().optional(),
    })
    .optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = payloadSchema.parse(body);
    const result = buildBoardPreview({
      level: payload.level,
      seed: payload.seed,
      filter: payload.filter,
    });
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "预览构建失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
