import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { levelConfigSchema } from "@/lib/validators/level";
import { buildUnityPreview } from "@/lib/pipeline/adapterPreview/unityPreview";
import { z } from "zod";

const schema = z.object({ levelIds: z.array(z.string()).min(1) });

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());
    const rows = await prisma.generatedLevel.findMany({ where: { id: { in: payload.levelIds } } });
    const levels = rows.map((r) => levelConfigSchema.parse(JSON.parse(r.levelJson)));
    return NextResponse.json({ success: true, data: buildUnityPreview(levels) });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "生成失败" }, { status: 400 });
  }
}
