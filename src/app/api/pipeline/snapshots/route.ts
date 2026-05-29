import { NextResponse } from "next/server";
import { z } from "zod";
import { createLevelSnapshot } from "@/lib/pipeline/snapshotService";

const schema = z.object({
  levelId: z.string(),
  snapshotName: z.string().min(1),
  note: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());
    const data = await createLevelSnapshot(payload.levelId, payload.snapshotName, payload.note);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "创建快照失败" }, { status: 400 });
  }
}
