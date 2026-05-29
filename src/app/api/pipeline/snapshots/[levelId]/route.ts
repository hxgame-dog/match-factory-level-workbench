import { NextResponse } from "next/server";
import { listLevelSnapshots } from "@/lib/pipeline/snapshotService";

type Params = { params: Promise<{ levelId: string }> };

export async function GET(_: Request, { params }: Params) {
  try {
    const { levelId } = await params;
    const data = await listLevelSnapshots(levelId);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "查询快照失败" }, { status: 400 });
  }
}
