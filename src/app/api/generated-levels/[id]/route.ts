import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { levelConfigSchema } from "@/lib/validators/level";

const updateSchema = z.object({
  name: z.string().min(1),
  level: levelConfigSchema,
  summary: z.string().optional(),
  warnings: z.array(z.string()).default([]),
  validation: z.unknown().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    const row = await prisma.generatedLevel.findUnique({ where: { id } });
    if (!row) {
      return NextResponse.json({ success: false, error: "关卡不存在" }, { status: 404 });
    }
    return NextResponse.json({
      success: true,
      data: {
        ...row,
        level: JSON.parse(row.levelJson),
        warnings: row.warningsJson ? JSON.parse(row.warningsJson) : [],
        validation: row.validationJson ? JSON.parse(row.validationJson) : null,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "获取关卡失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const payload = updateSchema.parse(body);
    const updated = await prisma.generatedLevel.update({
      where: { id },
      data: {
        name: payload.name,
        levelJson: JSON.stringify(payload.level),
        summary: payload.summary,
        warningsJson: JSON.stringify(payload.warnings),
        validationJson: payload.validation ? JSON.stringify(payload.validation) : undefined,
      },
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "更新关卡失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    await prisma.generatedLevel.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "删除关卡失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
