import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    const data = await prisma.levelFeedbackDiagnosis.findUnique({ where: { id } });
    if (!data) return NextResponse.json({ success: false, error: "诊断不存在" }, { status: 404 });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "查询失败" }, { status: 400 });
  }
}
