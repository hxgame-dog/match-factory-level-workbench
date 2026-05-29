import * as XLSX from "xlsx";

import type { GeneratedItemSetPayload } from "@/types/generatedItemSet";

export function buildGeneratedItemSetWorkbook(payload: GeneratedItemSetPayload): Buffer {
  const wb = XLSX.utils.book_new();

  const generatedItems = payload.items.map((item) => ({
    Role: item.role,
    SourceItemId: item.sourceItemId ?? "",
    CatalogItemId: item.catalogItemId ?? "",
    Name: item.name,
    DisplayName: item.displayName ?? "",
    Category1: item.category1,
    Category2: item.category2 ?? "",
    Color1: item.color1 ?? "",
    Color2: item.color2 ?? "",
    Shape: item.shape ?? "",
    Size: item.size ?? "",
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
      Theme: payload.theme,
      TotalItemCount: payload.totalItemCount,
      TargetTypeCount: payload.targetTypeCount,
      TargetCountEach: payload.targetCountEach,
      DistractorTypeCount: payload.distractorTypeCount,
      DifficultyIntent: payload.difficultyIntent ?? "",
      Constraints: payload.constraints ?? "",
      UseExistingCatalogOnly: payload.useExistingCatalogOnly ? "true" : "false",
      CreatedAt: new Date().toISOString(),
    },
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(config), "GenerationConfig");

  const warnings = (payload.warnings ?? []).map((warning) => ({ Warning: warning }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(warnings), "Warnings");

  const assetPrompts = payload.items.map((item) => ({
    Name: item.name,
    DisplayName: item.displayName ?? "",
    ImagePrompt: item.imagePrompt,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(assetPrompts), "AssetPrompts");

  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}
