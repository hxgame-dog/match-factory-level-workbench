"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PackageValidationResult } from "@/types/pipeline";

export function PackageValidationPanel({ validation }: { validation: PackageValidationResult | null }) {
  if (!validation) return null;
  return (
    <Card className="border border-border">
      <CardHeader><CardTitle className="text-sm">Package Validation Panel</CardTitle></CardHeader>
      <CardContent className="space-y-1 text-xs">
        <p>关卡数量：{validation.summary?.levelCount ?? 0}</p>
        <p>资源数量：{validation.summary?.assetCount ?? 0}</p>
        <p>缺失资源：{validation.summary?.missingAssetCount ?? 0}</p>
        <p>Schema 错误：{validation.summary?.errorCount ?? 0}</p>
        <p>Warning：{validation.summary?.warningCount ?? 0}</p>
        <p>状态：{validation.status}</p>
      </CardContent>
    </Card>
  );
}
