import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { importFormulaPreset } from "@/lib/pipeline/importFormulaPreset";

export async function POST(request: Request) {
  const job = await prisma.importJob.create({ data: { type: "formula_preset", status: "running" } });
  try {
    const body = await request.json();
    const data = await importFormulaPreset({ fileContent: String(body.fileContent ?? ""), dryRun: true });
    await prisma.importJob.update({ where: { id: job.id }, data: { status: "completed", summaryJson: JSON.stringify(data) } });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    await prisma.importJob.update({ where: { id: job.id }, data: { status: "failed", error: error instanceof Error ? error.message : "导入失败" } });
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "导入失败" }, { status: 400 });
  }
}
