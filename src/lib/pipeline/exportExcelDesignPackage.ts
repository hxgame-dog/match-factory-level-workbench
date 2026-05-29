import { promises as fs } from "fs";
import path from "path";
import * as XLSX from "xlsx";

export async function exportExcelDesignPackage(input: {
  itemCatalog: unknown[];
  itemSets: unknown[];
  levelSummary: unknown[];
  difficultyReport: unknown[];
  name: string;
}) {
  const wb = XLSX.utils.book_new();
  const add = (name: string, rows: unknown[]) =>
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), name);
  add("item_catalog", input.itemCatalog);
  add("generated_item_sets", input.itemSets);
  add("level_summary", input.levelSummary);
  add("difficulty_report", input.difficultyReport);
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const dir = path.join(process.cwd(), "public", "exports");
  await fs.mkdir(dir, { recursive: true });
  const fileName = `excel_design_package_${input.name.replace(/[^a-zA-Z0-9._-]/g, "_")}.xlsx`;
  await fs.writeFile(path.join(dir, fileName), buffer);
  return `/exports/${fileName}`;
}
