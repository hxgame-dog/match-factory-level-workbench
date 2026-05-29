import * as XLSX from "xlsx";
import { NextResponse } from "next/server";

import { getPaletteColorEnglish } from "@/lib/items/colorPalette";
import type { GeneratedItemSetPayload } from "@/types/generatedItemSet";

export function cleanGeneratedItemSetFileName(name: string) {
  return name.replace(/[^\w\u4e00-\u9fa5-]/g, "_");
}

export function parseRiskTagsJson(json: string | null | undefined): string[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json) as unknown;
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function buildGeneratedItemSetWorkbook(
  payload: GeneratedItemSetPayload & { categories?: string[] },
): Buffer {
  const categories = payload.categories ?? [...new Set(payload.items.map((i) => i.category1))];
  const totalRows = payload.itemTypeCount * payload.colorCount;
  const wb = XLSX.utils.book_new();

  const generatedItems = payload.items.map((item, index) => ({
    ItemId: item.itemId ?? index + 1,
    Name: item.name,
    DisplayName: item.displayName ?? "",
    Category1: item.category1,
    Category2: item.category2 ?? "",
    Color1: item.color1 ? getPaletteColorEnglish(item.color1) : "",
    Color2: item.color2 ?? "",
    Shape: item.shape ?? "",
    Size: item.size ?? "",
    MoveSpeed: item.moveSpeed ?? "",
    TargetScale: item.targetScale ?? "",
    Count: item.count,
    IsNew: item.isNew ? "true" : "false",
    Reason: item.reason,
    ImagePrompt: item.imagePrompt,
    RiskTags: (item.riskTags ?? []).join(", "),
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(generatedItems), "GeneratedItems");

  const config = [
    {
      SetName: payload.name,
      Description: payload.description,
      ItemTypeCount: payload.itemTypeCount,
      ColorCount: payload.colorCount,
      TotalRows: totalRows,
      Categories: categories.join(", "),
      CreatedAt: new Date().toISOString(),
    },
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(config), "GenerationConfig");

  const warningList = payload.warnings ?? [];
  const warningRows =
    warningList.length > 0
      ? warningList.map((warning) => ({ Warning: warning }))
      : [{ Warning: "无" }];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(warningRows), "Warnings");

  const assetPrompts = payload.items.map((item) => ({
    Name: item.name,
    DisplayName: item.displayName ?? "",
    ImagePrompt: item.imagePrompt,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(assetPrompts), "AssetPrompts");

  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}

export function createGeneratedItemSetExcelResponse(
  payload: GeneratedItemSetPayload & { categories?: string[] },
  fileNameBase: string,
) {
  const workbook = buildGeneratedItemSetWorkbook(payload);
  const date = new Date().toISOString().slice(0, 10);
  const fileName = `generated_item_set_${cleanGeneratedItemSetFileName(fileNameBase)}_${date}.xlsx`;
  return new NextResponse(new Uint8Array(workbook), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
