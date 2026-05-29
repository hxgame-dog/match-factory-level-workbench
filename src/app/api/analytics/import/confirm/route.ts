import { NextResponse } from "next/server";

import { parseAnalyticsFile } from "@/lib/analytics/parseAnalyticsFile";
import { prisma } from "@/lib/prisma";
import { importConfirmSchema } from "@/lib/validators/analytics";

export async function POST(request: Request) {
  try {
    const payload = importConfirmSchema.parse(await request.json());
    const preview = parseAnalyticsFile({
      fileContent: payload.fileContent,
      fileType: payload.fileType,
      manualMapping: payload.fieldMapping,
    });
    const batch = await prisma.analyticsImportBatch.create({
      data: {
        name: payload.batchName,
        source: payload.source,
        dataType: "level_metrics",
        status: preview.summary.invalidRows > 0 ? "partial_failed" : "imported",
        fieldMappingJson: JSON.stringify(preview.fieldMapping),
        summaryJson: JSON.stringify(preview.summary),
        validationJson: JSON.stringify(preview.warnings),
        rows: {
          create: preview.rows.map((r) => ({
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
            rawJson: r.raw ? JSON.stringify(r.raw) : undefined,
          })),
        },
      },
    });
    return NextResponse.json({ success: true, data: { batchId: batch.id, summary: preview.summary } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "导入失败" }, { status: 400 });
  }
}
