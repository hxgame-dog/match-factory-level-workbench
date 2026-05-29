import { NextResponse } from "next/server";

import { buildCalibrationDataset } from "@/lib/analytics/buildCalibrationDataset";

export async function GET() {
  try {
    const data = await buildCalibrationDataset(80);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "获取校准数据失败" },
      { status: 500 },
    );
  }
}
