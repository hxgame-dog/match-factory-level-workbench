import { NextResponse } from "next/server";
import { exportPlaytestReport } from "@/lib/playtest/exportPlaytestReport";

type Params = { params: Promise<{ id: string }> };

export async function POST(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    const data = await exportPlaytestReport(id);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "导出报告失败" }, { status: 400 });
  }
}
