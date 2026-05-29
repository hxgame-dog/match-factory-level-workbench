import { NextResponse } from "next/server";

import { diagnoseBatch } from "@/lib/analytics/diagnoseBatchService";
import { summarizeCalibration } from "@/lib/analytics/compareFormulaPlaytestAnalytics";
import { diagnoseBatchSchema } from "@/lib/validators/analytics";

export async function POST(request: Request) {
  try {
    const payload = diagnoseBatchSchema.parse(await request.json());
    const { results, unmatchedCount } = await diagnoseBatch({
      batchId: payload.batchId,
      formulaPresetId: payload.formulaPresetId,
      includePlaytest: payload.includePlaytest,
      saveResults: payload.saveResults,
      writeBackToLevels: payload.writeBackToLevels,
    });
    const summary = summarizeCalibration(results);
    return NextResponse.json({ success: true, data: { results, unmatchedCount, summary } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "批量诊断失败" }, { status: 400 });
  }
}
