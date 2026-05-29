import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    const data = await prisma.playtestSimulationRun.findUnique({
      where: { id },
      include: { results: { orderBy: [{ levelIndex: "asc" }, { createdAt: "asc" }] } },
    });
    if (!data) return NextResponse.json({ success: false, error: "Run 不存在" }, { status: 404 });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "查询失败" }, { status: 400 });
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    await prisma.playtestSimulationRun.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "删除失败" }, { status: 400 });
  }
}
