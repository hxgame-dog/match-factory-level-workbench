import JSZip from "jszip";
import { importLevelJson } from "@/lib/pipeline/importLevelJson";
import type { ImportResult } from "@/types/pipeline";

export async function importLevelsZip(input: { fileBuffer: Buffer; dryRun: boolean }): Promise<ImportResult> {
  const zip = await JSZip.loadAsync(input.fileBuffer);
  const jsonEntries = Object.keys(zip.files).filter((name) => name.endsWith(".json"));
  const items: ImportResult["items"] = [];
  for (const file of jsonEntries) {
    try {
      const content = await zip.file(file)?.async("string");
      if (!content) {
        items.push({ name: file, status: "failed", error: "空文件" });
        continue;
      }
      const result = await importLevelJson({ fileContent: content, dryRun: input.dryRun });
      items.push({ name: file, status: result.success ? "ok" : "failed", error: result.success ? undefined : result.summary });
    } catch (error) {
      items.push({ name: file, status: "failed", error: error instanceof Error ? error.message : "导入失败" });
    }
  }
  const passed = items.filter((i) => i.status === "ok").length;
  return {
    success: passed > 0,
    summary: `处理 ${items.length} 个文件，成功 ${passed} 个`,
    total: items.length,
    passed,
    failed: items.length - passed,
    items,
  };
}
