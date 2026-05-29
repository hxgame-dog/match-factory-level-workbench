import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { importLevelsZip } from "@/lib/pipeline/importLevelsZip";

export async function POST(request: Request) {
  const job = await prisma.importJob.create({ data: { type: "levels_zip", status: "running" } });
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new Error("缺少 ZIP 文件");
    const buffer = Buffer.from(await file.arrayBuffer());
    const data = await importLevelsZip({ fileBuffer: buffer, dryRun: false });
    await prisma.importJob.update({ where: { id: job.id }, data: { status: data.failed > 0 ? "partial_failed" : "completed", summaryJson: JSON.stringify(data), validationJson: JSON.stringify(data.items), fileName: file.name } });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    await prisma.importJob.update({ where: { id: job.id }, data: { status: "failed", error: error instanceof Error ? error.message : "导入失败" } });
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "导入失败" }, { status: 400 });
  }
}
