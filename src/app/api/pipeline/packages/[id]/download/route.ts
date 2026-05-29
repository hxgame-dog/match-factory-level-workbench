import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    const pkg = await prisma.productionPackage.findUnique({ where: { id } });
    if (!pkg) return NextResponse.json({ success: false, error: "Package 不存在" }, { status: 404 });
    if (!pkg.exportPath) return NextResponse.json({ success: false, error: "Package 尚未导出" }, { status: 400 });
    return NextResponse.json({ success: true, data: { url: pkg.exportPath } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "下载失败" }, { status: 400 });
  }
}
