import { NextResponse } from "next/server";

import { createGeneratedItemSetExcelResponse } from "@/lib/generatedItemSetExport";
import { prepareGeneratedItemSetExportPayload } from "@/lib/generatedItemSetPayload";

export const runtime = "nodejs";

/** 根据当前内存中的道具表数据导出 Excel（无需先落库） */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = prepareGeneratedItemSetExportPayload(body);
    return createGeneratedItemSetExcelResponse(payload, payload.name);
  } catch (error) {
    const message = error instanceof Error ? error.message : "导出失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
