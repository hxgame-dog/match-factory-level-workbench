import { NextResponse } from "next/server";

import { parseAnalyticsFile } from "@/lib/analytics/parseAnalyticsFile";
import { importDryRunSchema } from "@/lib/validators/analytics";

export async function POST(request: Request) {
  try {
    const payload = importDryRunSchema.parse(await request.json());
    const preview = parseAnalyticsFile({
      fileContent: payload.fileContent,
      fileType: payload.fileType,
      manualMapping: payload.fieldMapping,
    });
    return NextResponse.json({ success: true, data: preview });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "预检失败" }, { status: 400 });
  }
}
