import { NextResponse } from "next/server";
import { z } from "zod";

import { defaultFormulaConfig } from "@/lib/difficulty/defaultFormulaConfig";
import { prisma } from "@/lib/prisma";
import { difficultyFormulaConfigSchema } from "@/lib/validators/difficulty";

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  config: difficultyFormulaConfigSchema.optional(),
});

export async function GET() {
  try {
    const rows = await prisma.formulaPreset.findMany({ orderBy: { updatedAt: "desc" } });
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : "获取公式预设失败";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = createSchema.parse(body);
    const created = await prisma.formulaPreset.create({
      data: {
        name: payload.name,
        description: payload.description,
        configJson: JSON.stringify(payload.config ?? defaultFormulaConfig),
      },
    });
    return NextResponse.json({ success: true, data: created });
  } catch (error) {
    const message = error instanceof Error ? error.message : "创建公式预设失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
