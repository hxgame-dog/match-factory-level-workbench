import Papa from "papaparse";

import { isNumericAnalyticsField } from "./fieldAliases";
import { buildFieldMapping } from "./mapAnalyticsFields";
import { calculateAnalyticsMetrics } from "./calculateAnalyticsMetrics";
import { validateAnalyticsRows } from "./validateAnalyticsRows";
import type { AnalyticsImportPreview, StandardLevelAnalyticsRow } from "@/types/analytics";

function toNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  const cleaned = String(value).replace(/[%,\s]/g, "");
  const num = Number(cleaned);
  if (!Number.isFinite(num)) return undefined;
  if (typeof value === "string" && value.includes("%")) return num / 100;
  return num;
}

function rawRecordsFromContent(fileContent: string, fileType: "csv" | "json" | "excel"): Record<string, unknown>[] {
  if (fileType === "json") {
    const parsed = JSON.parse(fileContent) as unknown;
    if (Array.isArray(parsed)) return parsed as Record<string, unknown>[];
    if (parsed && typeof parsed === "object" && Array.isArray((parsed as { rows?: unknown[] }).rows)) {
      return (parsed as { rows: Record<string, unknown>[] }).rows;
    }
    return [parsed as Record<string, unknown>];
  }
  // csv 与 excel(转成 csv 文本)统一走 Papa
  const parsed = Papa.parse<Record<string, unknown>>(fileContent, { header: true, skipEmptyLines: true });
  return parsed.data;
}

export function parseAnalyticsFile(input: {
  fileContent: string;
  fileType: "csv" | "json" | "excel";
  manualMapping?: Record<string, string>;
}): AnalyticsImportPreview {
  const records = rawRecordsFromContent(input.fileContent, input.fileType);
  const detectedFields = records.length ? Object.keys(records[0]) : [];
  const { mapping, unmapped } = buildFieldMapping(detectedFields, input.manualMapping);

  const rows: StandardLevelAnalyticsRow[] = [];
  const warnings: AnalyticsImportPreview["warnings"] = [];

  records.forEach((record, index) => {
    const standard: StandardLevelAnalyticsRow = { raw: record };
    const target = standard as Record<string, unknown>;
    for (const [original, value] of Object.entries(record)) {
      const field = mapping[original];
      if (!field) continue;
      if (field === "levelId" || field === "levelName") {
        target[field] = value === null || value === undefined ? undefined : String(value);
      } else if (isNumericAnalyticsField(field)) {
        const num = toNumber(value);
        if (num === undefined && value !== "" && value !== null && value !== undefined) {
          warnings.push({ row: index + 1, field, message: `无法解析数值: ${String(value)}` });
        }
        target[field] = num;
      }
    }
    const { row: withMetrics, warnings: metricWarnings } = calculateAnalyticsMetrics(standard);
    metricWarnings.forEach((message) => warnings.push({ row: index + 1, message }));
    rows.push(withMetrics);
  });

  const validation = validateAnalyticsRows(rows);
  validation.warnings.forEach((w) => warnings.push(w));

  return {
    detectedFields,
    fieldMapping: mapping,
    unmappedFields: unmapped,
    rows,
    warnings,
    summary: {
      totalRows: rows.length,
      validRows: validation.validCount,
      invalidRows: rows.length - validation.validCount,
    },
  };
}
