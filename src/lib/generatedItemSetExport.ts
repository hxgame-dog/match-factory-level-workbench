import * as XLSX from "xlsx";
import { NextResponse } from "next/server";

import { getPaletteColorEnglish } from "@/lib/items/colorPalette";
import { zh } from "@/lib/i18n/zh";
import type { GeneratedItemSetPayload } from "@/types/generatedItemSet";

const moveSpeedLabels = zh.pages.itemGenerator.moveSpeedLabels;

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

function dimensionRow(item: GeneratedItemSetPayload["items"][number], index: number) {
  const speed = item.moveSpeed ?? 3;
  return {
    道具ID: item.itemId ?? index + 1,
    一级分类: item.category1,
    二级分类: item.category2 ?? "",
    主色: item.color1 ? getPaletteColorEnglish(item.color1) : "",
    辅色: item.color2 ?? "",
    形态: item.shape ?? "",
    尺寸: item.size ?? "",
    花纹: item.pattern ?? "纯色",
    移动速度: `${speed} · ${moveSpeedLabels[speed as 1 | 2 | 3 | 4 | 5] ?? speed}`,
    目标缩放: item.targetScale ?? "",
  };
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
    Pattern: item.pattern ?? "纯色",
    MoveSpeed: item.moveSpeed ?? "",
    TargetScale: item.targetScale ?? "",
    IsNew: item.isNew ? "true" : "false",
    Reason: item.reason,
    ImagePrompt: item.imagePrompt,
    RiskTags: (item.riskTags ?? []).join(", "),
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(generatedItems), "GeneratedItems");

  const dimensionRows = payload.items.map((item, index) => dimensionRow(item, index));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dimensionRows), "DimensionView");

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
  const safeBase = cleanGeneratedItemSetFileName(fileNameBase);
  const fileName = `generated_item_set_${safeBase}_${date}.xlsx`;
  const encodedFileName = encodeURIComponent(fileName);
  return new NextResponse(new Uint8Array(workbook), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="generated_item_set_${date}.xlsx"; filename*=UTF-8''${encodedFileName}`,
      "Content-Length": String(workbook.length),
    },
  });
}
