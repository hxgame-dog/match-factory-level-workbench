import * as XLSX from "xlsx";

import { parseItemRecords, type ItemParseResult } from "@/lib/csv";

type ExportRow = {
  itemId: number | null;
  name: string;
  category1: string;
  category2: string | null;
  color1: string | null;
  color2: string | null;
  shape: string | null;
  size: string | null;
  targetScale: number | null;
};

export function buildItemCatalogWorkbook(rows: ExportRow[]): Buffer {
  const sheetData = rows.map((row) => ({
    ItemId: row.itemId ?? "",
    Name: row.name,
    Category1: row.category1,
    Category2: row.category2 ?? "",
    Color1: row.color1 ?? "",
    Color2: row.color2 ?? "",
    Shape: row.shape ?? "",
    Size: row.size ?? "",
    "Target Scale": row.targetScale ?? "",
  }));
  const ws = XLSX.utils.json_to_sheet(sheetData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Items");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}

function isEmptyRow(row: Record<string, unknown>): boolean {
  return Object.values(row).every((v) => v == null || String(v).trim() === "");
}

export function parseItemExcel(buffer: Buffer): ItemParseResult {
  const wb = XLSX.read(buffer, { type: "buffer" });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) {
    return { successRows: [], errors: [], missingHeaders: ["name", "category1"] };
  }
  const sheet = wb.Sheets[sheetName];
  const records = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  const filtered = records.filter((row) => !isEmptyRow(row));
  return parseItemRecords(filtered);
}

export function isExcelFileName(name: string): boolean {
  const lower = name.toLowerCase();
  return lower.endsWith(".xlsx") || lower.endsWith(".xls");
}
