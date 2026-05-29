import Papa from "papaparse";

import { itemCsvRawSchema } from "@/lib/validators/item";

const HEADER_ALIAS_MAP: Record<string, string> = {
  itemid: "itemId",
  name: "name",
  category1: "category1",
  category2: "category2",
  color1: "color1",
  color2: "color2",
  shape: "shape",
  size: "size",
  col_7: "col7",
  col7: "col7",
  "target scale": "targetScale",
  targetscale: "targetScale",
};

export type ParsedItemRow = {
  itemId?: number;
  name: string;
  category1: string;
  category2?: string;
  color1?: string;
  color2?: string;
  shape?: string;
  size?: string;
  col7?: string;
  targetScale?: number;
};

type ParseResult = {
  successRows: ParsedItemRow[];
  errors: Array<{ row: number; message: string }>;
  missingHeaders: string[];
};

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, " ");
}

function standardizeRow(raw: Record<string, unknown>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    const normalized = normalizeHeader(key).replace(/\s/g, "");
    const alias =
      HEADER_ALIAS_MAP[normalizeHeader(key)] ??
      HEADER_ALIAS_MAP[normalized] ??
      key.trim();
    row[alias] = value;
  }
  return row;
}

export function parseItemCsv(csvText: string): ParseResult {
  const parsed = Papa.parse<Record<string, unknown>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const missingHeaders = ["name", "category1"].filter((required) => {
    const fields = parsed.meta.fields ?? [];
    return !fields.some((field) => {
      const standardized = standardizeRow({ [field]: "" });
      return Object.keys(standardized).includes(required);
    });
  });

  const successRows: ParsedItemRow[] = [];
  const errors: Array<{ row: number; message: string }> = [];

  parsed.data.forEach((raw, index) => {
    const standardized = standardizeRow(raw);
    const validated = itemCsvRawSchema.safeParse(standardized);
    if (!validated.success) {
      errors.push({
        row: index + 2,
        message: validated.error.issues.map((it) => it.message).join("; "),
      });
      return;
    }
    successRows.push(validated.data);
  });

  return {
    successRows,
    errors,
    missingHeaders,
  };
}
