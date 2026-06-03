import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    const batch = await prisma.assetGenerationBatch.findUnique({
      where: { id },
      include: { assets: true, masters: true, styleProfile: true },
    });
    if (!batch) {
      return NextResponse.json({ success: false, error: "批次不存在" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: batch });
  } catch (error) {
    const message = error instanceof Error ? error.message : "获取批次详情失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    await prisma.assetGenerationBatch.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "删除批次失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
