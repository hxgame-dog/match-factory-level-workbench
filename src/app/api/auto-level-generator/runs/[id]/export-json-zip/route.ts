import { NextResponse } from "next/server";

import { exportAutoLevelsZip } from "@/lib/auto-level/exportAutoLevelsZip";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function POST(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    const run = await prisma.autoLevelGenerationRun.findUnique({
      where: { id },
      include: { candidates: { where: { status: { in: ["selected", "candidate", "saved"] } }, orderBy: [{ targetLevelIndex: "asc" }, { candidateRank: "asc" }] } },
    });
    if (!run) return NextResponse.json({ success: false, error: "Run 不存在" }, { status: 404 });
    const result = run.resultJson ? JSON.parse(run.resultJson) : {};
    const zip = await exportAutoLevelsZip({
      runId: run.id,
      summary: result.summary ?? {},
      targetCurve: result.targetCurve ?? [],
      sourceAnalysis: result.sourceAnalysis ?? {},
      candidates: run.candidates.map((c) => ({ id: c.id, targetLevelIndex: c.targetLevelIndex, candidateRank: c.candidateRank, levelJson: c.levelJson })),
    });
    return new NextResponse(new Uint8Array(zip), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="auto_level_run_${run.id}.zip"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "导出 ZIP 失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
