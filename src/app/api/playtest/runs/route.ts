import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const data = await prisma.playtestSimulationRun.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { results: { select: { id: true, status: true, passRate: true, qaIssuesJson: true } } },
    });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "获取历史失败" }, { status: 500 });
  }
}
