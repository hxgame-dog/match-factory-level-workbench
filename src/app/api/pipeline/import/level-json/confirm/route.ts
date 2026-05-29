import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { importLevelJson } from "@/lib/pipeline/importLevelJson";

export async function POST(request: Request) {
  const job = await prisma.importJob.create({ data: { type: "level_json", status: "running" } });
  try {
    const body = await request.json();
    const data = await importLevelJson({ fileContent: String(body.fileContent ?? ""), dryRun: false });
    await prisma.importJob.update({
      where: { id: job.id },
      data: { status: "completed", summaryJson: JSON.stringify(data), validationJson: JSON.stringify(data.items) },
    });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    await prisma.importJob.update({ where: { id: job.id }, data: { status: "failed", error: error instanceof Error ? error.message : "导入失败" } });
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "导入失败" }, { status: 400 });
  }
}
