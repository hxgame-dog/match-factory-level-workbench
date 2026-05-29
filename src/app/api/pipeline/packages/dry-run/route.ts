import { NextResponse } from "next/server";
import { buildProductionPackage } from "@/lib/pipeline/buildProductionPackage";
import { buildPackageInputSchema } from "@/lib/validators/pipeline";

export async function POST(request: Request) {
  try {
    const payload = buildPackageInputSchema.parse(await request.json());
    const data = await buildProductionPackage({ ...payload, dryRun: true });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "预检失败" }, { status: 400 });
  }
}
