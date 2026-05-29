import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function POST(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    await prisma.$transaction(async (tx) => {
      await tx.formulaPreset.updateMany({ data: { isDefault: false } });
      await tx.formulaPreset.update({ where: { id }, data: { isDefault: true } });
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "设置默认失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
