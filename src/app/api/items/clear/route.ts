import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const result = await prisma.itemCatalog.deleteMany();
    return NextResponse.json({
      success: true,
      deletedCount: result.count,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "清空失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
