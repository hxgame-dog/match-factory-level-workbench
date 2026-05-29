import { NextResponse } from "next/server";
import { restoreLevelSnapshot } from "@/lib/pipeline/snapshotService";

type Params = { params: Promise<{ snapshotId: string }> };

export async function POST(_: Request, { params }: Params) {
  try {
    const { snapshotId } = await params;
    const data = await restoreLevelSnapshot(snapshotId);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "恢复快照失败" }, { status: 400 });
  }
}
