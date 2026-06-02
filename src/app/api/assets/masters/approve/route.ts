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

    const updated = await prisma.itemMasterTemplate.update({
      where: { batchId_baseItemName: { batchId: input.batchId, baseItemName: input.baseItemName } },
      data: {
        status: "approved",
        approvedAt: new Date(),
        approvedBy: input.approvedBy ?? null,
      },
    });

    return NextResponse.json({ success: true, data: { id: updated.id, status: updated.status } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "审批失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

