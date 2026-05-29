import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const runs = await prisma.autoLevelGenerationRun.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { candidates: { select: { id: true, status: true } } },
    });
    return NextResponse.json({ success: true, data: runs });
  } catch (error) {
    const message = error instanceof Error ? error.message : "获取自动续关历史失败";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
