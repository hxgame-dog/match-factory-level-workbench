"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AnalyticsImportPreview } from "@/types/analytics";

export function FieldMappingTable({ preview }: { preview: AnalyticsImportPreview | null }) {
  if (!preview) return null;
  return (
    <Card className="border border-border">
      <CardHeader><CardTitle className="text-sm">字段映射结果</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-xs">
        <p>识别字段：{preview.detectedFields.length} 个 · 有效行 {preview.summary.validRows}/{preview.summary.totalRows}</p>
        <div className="grid grid-cols-2 gap-1">
          {Object.entries(preview.fieldMapping).map(([from, to]) => (
            <div key={from} className="rounded border border-border px-2 py-1">
              {from} → <span className="text-blue-600">{to}</span>
            </div>
          ))}
        </div>
        {preview.unmappedFields.length ? (
          <p className="text-amber-600">未识别字段：{preview.unmappedFields.join(", ")}</p>
        ) : null}
        {preview.warnings.length ? (
          <div className="max-h-32 overflow-auto rounded border border-amber-200 bg-amber-50 p-2">
            {preview.warnings.slice(0, 30).map((w, i) => (
              <p key={i}>行{w.row}{w.field ? `·${w.field}` : ""}: {w.message}</p>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
