import { NextResponse } from "next/server";

import { getWorkspaceSummaries } from "@/lib/workspace/getWorkspaceSummaries";

export async function GET() {
  try {
    const data = await getWorkspaceSummaries(20);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "获取工作区列表失败";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
