import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const inputSchema = z.object({
  batchId: z.string().min(1),
  baseItemName: z.string().min(1),
  approvedBy: z.string().optional(),
});

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const input = inputSchema.parse(await request.json());

    const template = await prisma.itemMasterTemplate.findUnique({
      where: { batchId_baseItemName: { batchId: input.batchId, baseItemName: input.baseItemName } },
    });
    if (!template) return NextResponse.json({ success: false, error: "未找到物品组" }, { status: 404 });

    if (template.status !== "ready" && template.status !== "failed") {
      return NextResponse.json(
        { success: false, error: "请先生成色板图并处于待确认状态" },
        { status: 400 },
      );
    }
    if (!template.sheetImageUrl) {
      return NextResponse.json({ success: false, error: "缺少色板图，无法确认" }, { status: 400 });
    }

    const updated = await prisma.itemMasterTemplate.update({
      where: { id: template.id },
      data: {
        status: "approved",
        approvedAt: new Date(),
        approvedBy: input.approvedBy ?? null,
      },
    });

    return NextResponse.json({ success: true, data: { id: updated.id, status: updated.status } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "色板确认失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
