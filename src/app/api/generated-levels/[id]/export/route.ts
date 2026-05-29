import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9-_]/g, "_");
}

export async function POST(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    const row = await prisma.generatedLevel.findUnique({ where: { id } });
    if (!row) {
      return NextResponse.json({ success: false, error: "关卡不存在" }, { status: 404 });
    }
    const payload = {
      schemaVersion: 1,
      type: "match3d_level_config",
      level: JSON.parse(row.levelJson),
    };
    const fileName = `level_${row.levelIndex ?? "x"}_${safeName(row.name)}.json`;
    return new NextResponse(JSON.stringify(payload, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "导出失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
