import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { difficultyFormulaConfigSchema } from "@/lib/validators/difficulty";

const updateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  config: difficultyFormulaConfigSchema,
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    const row = await prisma.formulaPreset.findUnique({ where: { id } });
    if (!row) return NextResponse.json({ success: false, error: "预设不存在" }, { status: 404 });
    return NextResponse.json({ success: true, data: { ...row, config: JSON.parse(row.configJson) } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "读取预设失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const payload = updateSchema.parse(body);
    const updated = await prisma.formulaPreset.update({
      where: { id },
      data: {
        name: payload.name,
        description: payload.description,
        configJson: JSON.stringify(payload.config),
      },
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "更新预设失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    await prisma.formulaPreset.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "删除预设失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
