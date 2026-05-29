import { z } from "zod";

const toOptionalString = z.preprocess((value) => {
  if (value == null) return undefined;
  const text = String(value).trim();
  return text.length > 0 ? text : undefined;
}, z.string().optional());

const toOptionalNumber = z.preprocess((value) => {
  if (value == null) return undefined;
  const text = String(value).trim();
  if (!text) return undefined;
  const parsed = Number(text);
  return Number.isNaN(parsed) ? value : parsed;
}, z.number().optional());

export const itemCsvRawSchema = z.object({
  itemId: toOptionalNumber,
  name: z.string().trim().min(1, "Name 为必填"),
  category1: z.string().trim().min(1, "Category1 为必填"),
  category2: toOptionalString,
  color1: toOptionalString,
  color2: toOptionalString,
  shape: toOptionalString,
  size: toOptionalString,
  col7: toOptionalString,
  targetScale: toOptionalNumber,
});

export const itemQuerySchema = z.object({
  search: z.string().optional(),
  category1: z.string().optional(),
  color1: z.string().optional(),
  size: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z
    .enum(["itemId", "name", "category1", "targetScale", "createdAt"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const importModeSchema = z.object({
  overwrite: z.coerce.boolean().default(true),
});

export type ItemCsvRawInput = z.infer<typeof itemCsvRawSchema>;
export type ItemQueryInput = z.infer<typeof itemQuerySchema>;
