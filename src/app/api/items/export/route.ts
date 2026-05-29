import { NextResponse } from "next/server";

import { buildItemCatalogWorkbook } from "@/lib/excel";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const rows = await prisma.itemCatalog.findMany({
      orderBy: [{ category1: "asc" }, { name: "asc" }],
    });
    const buffer = buildItemCatalogWorkbook(rows);
    const data = new Uint8Array(buffer);

    return new NextResponse(data, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="item_catalog_export.xlsx"',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "导出失败";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
