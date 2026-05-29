import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const rows = await prisma.difficultyDiagnosisRun.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : "获取诊断历史失败";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
