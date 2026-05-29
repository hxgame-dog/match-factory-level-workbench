import { NextResponse } from "next/server";

import { parseItemCsv } from "@/lib/csv";
import { prisma } from "@/lib/prisma";
import { importModeSchema } from "@/lib/validators/item";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const overwriteRaw = formData.get("overwrite") ?? "true";
    const overwrite = importModeSchema.parse({ overwrite: overwriteRaw }).overwrite;

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "请上传 CSV 文件" },
        { status: 400 },
      );
    }

    const text = await file.text();
    const parsed = parseItemCsv(text);
    if (parsed.missingHeaders.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `缺少必填字段: ${parsed.missingHeaders.join(", ")}`,
          missingHeaders: parsed.missingHeaders,
        },
        { status: 400 },
      );
    }

    await prisma.$transaction(async (tx) => {
      if (overwrite) {
        await tx.itemCatalog.deleteMany();
      }
      for (const row of parsed.successRows) {
        if (typeof row.itemId === "number") {
          await tx.itemCatalog.upsert({
            where: { itemId: row.itemId },
            create: {
              itemId: row.itemId,
              name: row.name,
              category1: row.category1,
              category2: row.category2 ?? null,
              color1: row.color1 ?? null,
              color2: row.color2 ?? null,
              shape: row.shape ?? null,
              size: row.size ?? null,
              col7: row.col7 ?? null,
              targetScale: row.targetScale ?? null,
            },
            update: {
              name: row.name,
              category1: row.category1,
              category2: row.category2 ?? null,
              color1: row.color1 ?? null,
              color2: row.color2 ?? null,
              shape: row.shape ?? null,
              size: row.size ?? null,
              col7: row.col7 ?? null,
              targetScale: row.targetScale ?? null,
            },
          });
          continue;
        }

        await tx.itemCatalog.create({
          data: {
            name: row.name,
            category1: row.category1,
            category2: row.category2 ?? null,
            color1: row.color1 ?? null,
            color2: row.color2 ?? null,
            shape: row.shape ?? null,
            size: row.size ?? null,
            col7: row.col7 ?? null,
            targetScale: row.targetScale ?? null,
          },
        });
      }
    });

    return NextResponse.json({
      success: true,
      importedCount: parsed.successRows.length,
      failedCount: parsed.errors.length,
      errors: parsed.errors,
      overwrite,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "导入失败";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
