import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    const run = await prisma.autoLevelGenerationRun.findUnique({
      where: { id },
      include: { candidates: { orderBy: [{ targetLevelIndex: "asc" }, { candidateRank: "asc" }] } },
    });
    if (!run) return NextResponse.json({ success: false, error: "Run 不存在" }, { status: 404 });
    return NextResponse.json({ success: true, data: run });
  } catch (error) {
    const message = error instanceof Error ? error.message : "获取 run 详情失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    await prisma.autoLevelGenerationRun.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "删除 run 失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
