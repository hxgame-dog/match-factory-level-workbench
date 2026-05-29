import { NextResponse } from "next/server";

import { saveCandidateAsGeneratedLevel } from "@/lib/auto-level/saveCandidateAsGeneratedLevel";

type Params = { params: Promise<{ id: string }> };

export async function POST(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    const data = await saveCandidateAsGeneratedLevel(id);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "保存候选失败";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
