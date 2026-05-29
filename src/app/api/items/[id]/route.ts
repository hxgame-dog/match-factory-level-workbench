import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    const existing = await prisma.itemCatalog.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "未找到该道具" }, { status: 404 });
    }
    await prisma.itemCatalog.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "删除失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
