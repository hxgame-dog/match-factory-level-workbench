import { NextResponse } from "next/server";

import { generateMockAnalytics } from "@/lib/analytics/analyticsMockData";
import { defaultFormulaConfig } from "@/lib/difficulty/defaultFormulaConfig";
import { diagnoseLevelDifficulty } from "@/lib/difficulty/diagnoseLevelDifficulty";
import { prisma } from "@/lib/prisma";
import { levelConfigSchema } from "@/lib/validators/level";
import { mockGenerateSchema } from "@/lib/validators/analytics";

export async function POST(request: Request) {
  try {
    const payload = mockGenerateSchema.parse(await request.json());
    const where = payload.levelIds?.length ? { id: { in: payload.levelIds } } : undefined;
    const levels = await prisma.generatedLevel.findMany({ where, orderBy: [{ levelIndex: "asc" }, { createdAt: "desc" }], take: 200 });
    if (!levels.length) {
      return NextResponse.json({ success: false, error: "没有可用的 GeneratedLevel，无法生成 Mock 数据" }, { status: 400 });
    }
    const mockInputs = levels.map((row) => {
      let formulaP: number | undefined;
      try {
        const level = levelConfigSchema.parse(JSON.parse(row.levelJson));
        formulaP = diagnoseLevelDifficulty({ level, formulaConfig: defaultFormulaConfig }).score.P;
      } catch {
        formulaP = undefined;
      }
      return { levelId: row.id, levelIndex: row.levelIndex, levelName: row.name, formulaP };
    });
    const rows = generateMockAnalytics({ levels: mockInputs, mode: payload.mode, seed: payload.batchName });
    const batch = await prisma.analyticsImportBatch.create({
      data: {
        name: payload.batchName,
        source: "mock",
        status: "imported",
        summaryJson: JSON.stringify({ totalRows: rows.length, validRows: rows.length, invalidRows: 0, mode: payload.mode }),
        rows: {
          create: rows.map((r) => ({
            levelId: r.levelId,
            levelIndex: r.levelIndex,
            levelName: r.levelName,
            users: r.users,
            starts: r.starts,
            completes: r.completes,
            fails: r.fails,
            quits: r.quits,
            retries: r.retries,
            passRate: r.passRate,
            failRate: r.failRate,
            quitRate: r.quitRate,
            retryRate: r.retryRate,
            avgDurationSec: r.avgDurationSec,
            avgRemainingTimeSec: r.avgRemainingTimeSec,
            avgMoves: r.avgMoves,
            avgBoostersUsed: r.avgBoostersUsed,
            avgHintsUsed: r.avgHintsUsed,
            avgShuffleUsed: r.avgShuffleUsed,
            revenue: r.revenue,
            adImpressions: r.adImpressions,
            iapPurchases: r.iapPurchases,
          })),
        },
      },
    });
    return NextResponse.json({ success: true, data: { batchId: batch.id, rowCount: rows.length } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Mock 生成失败" }, { status: 400 });
  }
}
