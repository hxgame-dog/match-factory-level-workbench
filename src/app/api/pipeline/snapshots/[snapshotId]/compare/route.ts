import { NextResponse } from "next/server";
import { compareLevelWithSnapshot } from "@/lib/pipeline/snapshotService";
import { z } from "zod";

type Params = { params: Promise<{ snapshotId: string }> };
const schema = z.object({ levelId: z.string() });

export async function GET(request: Request, { params }: Params) {
  try {
    const { snapshotId } = await params;
    const url = new URL(request.url);
    const levelId = schema.parse({ levelId: url.searchParams.get("levelId") }).levelId;
    const data = await compareLevelWithSnapshot(levelId, snapshotId);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "对比失败" }, { status: 400 });
  }
}
