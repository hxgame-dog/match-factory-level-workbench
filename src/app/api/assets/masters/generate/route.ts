import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** @deprecated 请使用 POST /api/assets/sheets/generate */
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: "母版单独出图已下线，请使用「生成色板」接口：POST /api/assets/sheets/generate",
    },
    { status: 410 },
  );
}
