import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** @deprecated 请使用 POST /api/assets/sheets/split */
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: "逐张变体出图已下线，请先确认色板后使用：POST /api/assets/sheets/split",
    },
    { status: 410 },
  );
}
